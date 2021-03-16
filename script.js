var vizInit = function (){
  
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  var fileLabel = document.querySelector("label.file");
  
  file.onchange = function() {
    fileLabel.classList.add('normal');
    audio.classList.add('active');
    var files = this.files;
    
    // Populate file name
    document.getElementById("fileName").classList.add('active');
    document.getElementById("fileName").innerHTML = files[0].name.replace(/\.[^/.]+$/, "");    
    
    // Audio player object
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
        
    var ballSat = 1;
    function render() {
        analyser.getByteFrequencyData(dataArray);

         sBalls.forEach( (value, index) => {
          if(index % 2 == 0){
            makeRoughBall(value.mesh,  modulate(lowerMaxFr, 0, 1, 0, 2), modulate(upperAvgFr, 0, 1, 0, 4));
          }
          else{
            makeRoughBall(value.mesh, modulate(Math.sqrt(lowerMaxFr), 0, 1, 0, 2), modulate(upperAvgFr, 0, 1, 0, 4));              
          }
          

        })
        ;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            var offset = mesh.geometry.parameters.radius;
            var amp = guiControls.amp;
            var time = Date.now();
            vertex.normalize();
            var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time * 0.00007, vertex.y +  time * 0.00008, vertex.z +  time * 0.00009) * amp * treFr;
            vertex.multiplyScalar(distance);
        });
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }

    function makeRoughGround(mesh, distortionFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            var amp = 2;
            var time = Date.now();
            var distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
            vertex.z = distance;
        });
    }

   
  };
}

window.onload = vizInit();
