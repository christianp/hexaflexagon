
function Thinger(source) {
    var thinger = this;

}
Thinger.prototype = {
}

'drag dragstart dragend dragover dragenter dragleave drop'.split(' ').forEach(function(ev) {
    document.body.addEventListener(ev,function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
});

var app;
fetch('trihexaflexagon-template.svg').then(function(r) {return r.text();}).then(function(source) {

var svg = source.replace(/\s*\n\s*/mg,' ').replace(/^.*<svg/,'<svg');
console.log(svg.slice(0,500));
document.getElementById('svg-container').innerHTML = svg;

app = new Vue({
    el: '#app',
    data: {
        data_uri: null,
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
            let result_container = document.querySelector('#result-container');
            let rect = result_container.getBoundingClientRect();
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
            document.getElementById('result-container').style.clipPath = clip_path;

            document.body.addEventListener('drop',function(e) {
                var files = e.dataTransfer.files;
                var f = files[0];
                var reader = new FileReader();
                reader.onload = function(e) {
                    app.data_uri = e.target.result;
                }
                reader.readAsDataURL(f);
            });

        }
    },
    watch: {
        data_uri: function() {
            var app = this;
            console.log('data');
            [1,2,3,4,5,6].forEach(function(i) {
                var segment = document.querySelector('svg #segment-'+i);
                segment.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',app.data_uri);
            });
            this.set_clip_path();
        },
        name: function() {
            var name = document.querySelector('svg #name tspan tspan');
            name.innerHTML = app.name;
        }
    },
    mounted: function() {
        var app = this;
        Webcam.attach( '#camera' );
        Webcam.set({
            width: 640,
            height: 480,
            dest_width: 640,
            dest_height: 480,
            crop_width: 480,
            crop_height: 480
        });

        this.set_clip_path();
    }
});

});
