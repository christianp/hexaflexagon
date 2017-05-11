function Thinger(source) {
    var thinger = this;
    var svg = source.replace(/\s*\n\s*/mg,' ').replace(/^.*<svg/,'<svg');
    console.log(svg.slice(0,500));
    document.getElementById('svg-container').innerHTML = svg;

    document.body.addEventListener('drop',function(e) {
        var files = e.dataTransfer.files;
        var f = files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            thinger.use_image(e.target.result);
        }
        reader.readAsDataURL(f);
    });

}
Thinger.prototype = {
    use_image: function(image) {
        [1,2,3,4,5,6].forEach(function(i) {
            var segment = document.querySelector('svg #segment-'+i);
            segment.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',image);
        });
    }
}

'drag dragstart dragend dragover dragenter dragleave drop'.split(' ').forEach(function(ev) {
    document.body.addEventListener(ev,function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
});

var thinger;

fetch('trihexaflexagon-template.svg').then(function(r) {
    console.log(r);
    return r.text();
}).then(function(t) {
    thinger = new Thinger(t);
});


Webcam.attach( '#my_camera' );
Webcam.set({
    dest_width: 640,
    dest_height: 480,
    crop_width: 480,
    crop_height: 480
});

function take_snapshot() {
    Webcam.snap(function(data_uri) {
        thinger.use_image(data_uri);
        document.getElementById('my_result').innerHTML = '<img src="'+data_uri+'"/>';
    } );
}
document.getElementById('take-snapshot').addEventListener('click',take_snapshot);

var app = new Vue({
    el: '#app',
    data: {
        data_uri: null,
    }
});
