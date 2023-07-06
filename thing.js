'drag dragstart dragend dragover dragenter dragleave drop'.split(' ').forEach(function(ev) {
    document.body.addEventListener(ev,function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
});

function element(name,attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg',name);
    if(attrs) {
        for(let [k,v] of Object.entries(attrs)) {
            e.setAttribute(k,v);
        }
    }
    return e;
}
function set_href(el,href) {
    el.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',href);
}

class HexaflexagonApp {
    constructor() {
        this.make_template();

        this.create_download();

        this.mode = 'template';

        document.getElementById('take-snapshot').addEventListener('click', () => {
            this.take_snapshot();
        });
        document.getElementById('print').addEventListener('click', () => {
            print();
        });
        document.getElementById('back-to-template').addEventListener('click', () => {
            this.mode = 'template';
        });

        const template_link = document.getElementById('template-link');
        template_link.setAttribute('href',window.location.href);
        template_link.querySelector('text').textContent = window.location.href;
    }

 
    /** 
     * Make the SVG template of the hexaflexagon.
     * There are three <image> elements, corresponding to each of the full faces of the hexaflexagon.
     * These are referred to by <use> elements with `clip-path` set, and positioned on the corresponding triangle of the template.
     * Triangle outlines are drawn on top of these to make it clear where to fold.
     */
    make_template() {
        const template_width = 260;
        const s = template_width / 5.5;
        const r3 = s * Math.sqrt(3)/2;

        const svg = document.getElementById('template');

        const g_hexaflexagon = element('g',{id:'hexaflexagon', transform: `translate(${(297-template_width)/2},80)`});
        svg.appendChild(g_hexaflexagon);

        const defs = element('defs');
        svg.appendChild(defs);

        const tri = element('path',{
            id:'triangle',
            d: `M 0 0 l ${s * 0.5} ${-r3} l ${s * 0.5} ${r3} z`,
            fill: 'none',
            stroke: 'black'
        });
        defs.appendChild(tri);

        function use(href, transform) {
            const u = element('use');
            if(transform) {
                u.setAttribute('transform',transform);
            }
            set_href(u,href);
            return u;
        }

        const image_defs = [0,1,2].map((i) => {
            const img = element('image', {id: `image-${i}`, width: 2*s, height: 2*s, preserveAspectRatio: 'xMidYMid slice'});
            defs.appendChild(img);
        });

        const {cos,sin} = Math;
        const sixth = Math.PI/3;

        const transforms = [
            [
                [-1, [1.5,1]],
                [3, [1.5,-1]],
                [3, [6,0]],
                [1, [3,-2]],
                [1, [3,-2]],
                [-1, [1.5,1]],
            ],
            [
                [-2, [3,0]],
                [-2, [3,0]],
                [2, [1.5,-1]],
                [2, [6,-2]],
                [0, [3,0]],
                [0, [3,0]],
            ],
            [
                [-2, [3.5,1]],
                [-2, [3.5,1]],
                [2, [2,-2]],
                [2, [2,-2]],
                [0, [3.5,-1]],
                [0, [3.5,-1]],
            ]
        ];
        transforms.forEach((n_transforms,n) => {
            const images = element('g',{id:`${n}-pieces`});
            g_hexaflexagon.appendChild(images);
            n_transforms.forEach(([rotation,[x,y]],j) => {
                const i = j+3;
                const clip = use(`#image-${n}`, `translate(${x*s} ${y*r3}) rotate(${rotation*60}) translate(${0} ${-s})`);
                const id = `clipPath-${n}-${j}`;
                clip.setAttribute('clip-path',`url(#${id})`);
                const clipPath = element('clipPath',{id});
                const path = element('path',{d:`M ${s + s*cos(i*sixth)} ${s + s*sin(i*sixth)} L ${s + s*cos((i+1)*sixth)} ${s + s*sin((i+1)*sixth)} ${s} ${s}`});
                clipPath.appendChild(path);
                defs.appendChild(clipPath);
                images.appendChild(clip);
            });
        });


        const g = element('g',{id:'triangles'});
        g_hexaflexagon.appendChild(g);

        for(let i=0;i<5;i++) {
            g.appendChild(use('#triangle', `translate(${s * i} 0)`));
            g.appendChild(use('#triangle', `translate(${s * (i + 1.5)} ${-r3}) rotate(180)`));
            g.appendChild(use('#triangle', `translate(${s * (i+0.5)} ${r3})`));
            g.appendChild(use('#triangle', `translate(${s * (i+1)} 0) rotate(180)`));
        }

        const hex_clipPath = element('clipPath',{id:'hexagon-clip'});
        defs.appendChild(hex_clipPath);
        const hex_path = element('path', {id: 'hexagon-path', stroke: 'black', 'stroke-width': s*0.02, fill: 'none', d: 'M '+[0,1,2,3,4,5].map(i=>`${s*(1 + cos(i*sixth))} ${s*(1 + sin(i*sixth))}`).join(' L ')+' z'});
        hex_clipPath.appendChild(hex_path);

        const image_previews = document.getElementById('image-previews');
        [0,1,2].forEach(i => {
            const box = document.createElement('div');
            box.classList.add('image-container');
            image_previews.appendChild(box);

            const psvg = element('svg',{id: `image-${i}-preview`, viewBox: `${-s*0.02} ${-s*0.02} ${2.04*s} ${2.04*s}`});
            const u = use(`#image-${i}`);
            u.setAttribute('clip-path','url(#hexagon-clip)');
            psvg.appendChild(u);
            psvg.appendChild(use('#hexagon-path'));
            box.appendChild(psvg);

            const take_photo_button = document.createElement('button');
            take_photo_button.classList.add('take-photo');
            take_photo_button.textContent = 'Take a photo';
            box.appendChild(take_photo_button);
            take_photo_button.addEventListener('click', e => {
                this.take_photo(i);
            });

            const pick_file_input = document.createElement('input');
            pick_file_input.type = 'file';
            pick_file_input.style.display = 'none';
            box.appendChild(pick_file_input);
            pick_file_input.addEventListener('change', e => {
                const f = pick_file_input.files[0];
                if(!f) {
                    return;
                }
                this.load_file(f,i);
            });

            const upload_photo_button = document.createElement('button');
            upload_photo_button.classList.add('upload-photo');
            upload_photo_button.textContent = 'Upload a picture';
            box.appendChild(upload_photo_button);
            upload_photo_button.addEventListener('click', e => {
                pick_file_input.click();
            });

            box.addEventListener('dragover', e => {
                box.classList.add('dragging');
            });
            box.addEventListener('dragleave', e => {
                box.classList.remove('dragging');
            });
            box.addEventListener('drop', e => {
                var files = e.dataTransfer.files;
                this.load_file(files[0],i);
                box.classList.remove('dragging');
            });
        });
    }

    take_photo(i) {
        this.mode = 'take-photo';
        this.replacing_image = i;
    }

    get mode() {
        return this._mode;
    }

    set mode(mode) {
        this._mode = mode;
        document.body.querySelectorAll('main > section').forEach(s => s.classList.toggle('show',s.dataset.mode == mode));

        if(mode == 'take-photo') {
            this.start_camera();
        } else {
            const video = document.getElementById('camera');
            video.srcObject = null;
        }
    }

    async start_camera() {
        const video = document.getElementById('camera');
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({audio: false, video:true});
        } catch(e) {
            this.mode = 'no-camera';
            return;
        }
        video.srcObject = stream;
        video.play();
        video.addEventListener('canplay', e => {
            this.streaming = true;
        }, false);
    }

    take_snapshot() {
        const video = document.getElementById('camera');
        const canvas = document.getElementById('photo');
        const context = canvas.getContext("2d");
        if(this.streaming) {
            const d = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = canvas.height = d;
            context.drawImage(video, (video.videoWidth-d)/2, (video.videoHeight-d)/2, d, d, 0, 0, 480,480);

            const data = this.data_uri = canvas.toDataURL("image/png");
            this.replace_image(this.replacing_image, data);
            this.mode = 'template';
        }
    }

    replace_image(i, data) {
        document.getElementById(`image-${i}-preview`).src = data;
        const image = document.getElementById(`image-${i}`);
        set_href(image, data);
        this.create_download();
    }

    create_download() {
        var doc = new PDFDocument({compress:false,layout:'landscape',size: 'A4'});
        SVGtoPDF(doc,document.querySelector('#template'),0,0,{useCSS:true});
        var stream = doc.pipe(blobStream());
        window.doc = doc;
        stream.on('finish', () => {
            var blob = stream.toBlob('application/pdf');
            window.blob = blob;
            this.download_url = URL.createObjectURL(blob);
            document.getElementById('download').href = this.download_url;
        });
        doc.end();
    }

    load_file(f,i) {
        var reader = new FileReader();
        reader.onload = e => {
            this.replace_image(i,e.target.result);
            this.mode = 'template';
        }
        reader.readAsDataURL(f);
    }

    set_name() {
        var name = document.querySelector('#svg-container svg #name tspan tspan');
        name.innerHTML = this.name;
    }
}

window.app = new HexaflexagonApp();
