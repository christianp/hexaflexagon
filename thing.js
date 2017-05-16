function hexagonise(el) {
    let rect = el.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;
    var r = height/2;
    var h = Math.sqrt(3)*r/2;
    var x1 = width/2-h;
    var x2 = width/2;
    var x3 = width/2+h;
    var y1 = 2*r;
    var y2 = 3*r/2;
    var y3 = r/2;
    var y4 = 0;
    var clip_path = 'polygon('+x1+'px '+y2+'px, '+x2+'px '+y1+'px, '+x3+'px '+y2+'px, '+x3+'px '+y3+'px, '+x2+'px '+y4+'px, '+x1+'px '+y3+'px)';
    el.style.clipPath = clip_path;
}
Vue.directive('hexagon',{
    inserted: hexagonise,
    componentUpdated: hexagonise
});


'drag dragstart dragend dragover dragenter dragleave drop'.split(' ').forEach(function(ev) {
    document.body.addEventListener(ev,function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
});

var app;
fetch('trihexaflexagon-template.svg').then(function(r) {return r.text();}).then(function(source) {

var svg = source.replace(/\s*\n\s*/mg,' ').replace(/^.*<svg/,'<svg');
document.getElementById('svg-container').innerHTML = svg;

app = new Vue({
    el: '#app',
    data: {
        data_uri: null,
        download_url: null,
        mode: 'take-photo',
        name: ''
    },
    methods: {
        take_snapshot: function() {
            var app = this;
            Webcam.snap(function(data_uri) {
                app.data_uri = data_uri;
                app.mode = 'confirm-photo';
            });
        },
        retake: function() {
            this.data_uri = null;
            this.mode = 'take-photo';
        },
        confirm_photo: function() {
            this.mode = 'show-hexaflexagon';
        },

        set_clip_path: function() {
        },
        create_download: function() {
            var app = this;

            if(this.mode!=='show-hexaflexagon') {
                return null;
            }

            var doc = new PDFDocument({compress:false,layout:'landscape',size: 'A4'});
            SVGtoPDF(doc,document.querySelector('#svg-container svg'),0,0,{useCSS:true});
            var stream = doc.pipe(blobStream());
            window.doc = doc;
            stream.on('finish',function() {
                var blob = stream.toBlob('application/pdf');
                window.blob = blob;
                app.download_url = URL.createObjectURL(blob);
            });
            doc.end();
        }
    },
    watch: {
        data_uri: function() {
            var app = this;
            [1,2,3,4,5,6].forEach(function(i) {
                var segment = document.querySelector('#svg-container svg #segment-'+i);
                segment.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',app.data_uri);
            });
        },
        name: function() {
            var name = document.querySelector('#svg-container svg #name tspan tspan');
            name.innerHTML = app.name;
        },
        mode: function() {
            if(this.mode=='show-hexaflexagon') {
                this.create_download();
            }
        }
    },
    mounted: function() {
        var app = this;
        Webcam.set({
            width: 640,
            height: 480,
            dest_width: 640,
            dest_height: 480,
            crop_width: 480,
            crop_height: 480
        });
        Webcam.attach( '#camera' );

        document.body.addEventListener('drop',function(e) {
            var files = e.dataTransfer.files;
            var f = files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                app.data_uri = e.target.result;
                app.mode = 'show-hexaflexagon';
            }
            reader.readAsDataURL(f);
        });
    }
});

});
