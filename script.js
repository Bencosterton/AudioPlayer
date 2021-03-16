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

    //WebGL
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0,0,150);
    camera.lookAt(scene.position);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true
    });
    
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    group.add(plane);
        
    var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = - 0.25 * Math.PI;
    plane2.scale = new THREE.Vector3( 2, 2, 2 );
    plane2.position.set(0, -150, 0);
    
    console.log(plane2);
    group.add(plane2);

    var ball = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 4), new THREE.MeshLambertMaterial({
        color: randColor(),
        wireframe: true,
    }));
    ball.position.set(0, 0, 0);
    group.add(ball);
    
    
    var nuofPeripheryBalls = 10;
    var sBalls = [];
    
    for (i = 0; i < nuofPeripheryBalls; i++){
      sBalls.push({
        mesh: new THREE.Mesh(new THREE.IcosahedronGeometry(3 + Math.random() * 2, 3),
                             new THREE.MeshLambertMaterial({color: randColor(),wireframe: false})),
        position: {
          distance : 40 + Math.pow(i, 2),
          angle : Math.random() * 2 * Math.PI,
        }
      });
    }
    
    
    var sGroup = new THREE.Group();
    sBalls.forEach( (value, index) => {
      value.mesh.position.z = value.position.distance * Math.cos(value.position.angle);
      value.mesh.position.y = value.position.distance * Math.sin(value.position.angle);
      sGroup.add(value.mesh);
    });

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 80, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    var orbitControls = new THREE.OrbitControls(camera);
    orbitControls.autoRotate = true;


    var guiControls = new function () {
        this.amp = 1.8;
        this.wireframe = true;
    }();
      

    sGroup.rotation.x = sGroup.rotation.y = sGroup.rotation.z = Math.PI * 0.5;
    scene.add(group);
    scene.add(sGroup);

    document.getElementById('out').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    render();

    var ballSat = 1;
    function render() {
        analyser.getByteFrequencyData(dataArray);

        var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
        var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

        var overallAvg = avg(dataArray);
        var lowerMax = max(lowerHalfArray);
        var lowerAvg = avg(lowerHalfArray);
        var upperMax = max(upperHalfArray);
        var upperAvg = avg(upperHalfArray);
      
        var lowerMaxFr = lowerMax / lowerHalfArray.length;
        var lowerAvgFr = lowerAvg / lowerHalfArray.length;
        var upperMaxFr = upperMax / upperHalfArray.length;
        var upperAvgFr = upperAvg / upperHalfArray.length;

        makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
        makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
        makeRoughBall(ball, modulate(Math.sqrt(lowerMaxFr), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

        ball.material.color = randColor(Math.floor(modulate(upperAvgFr, 0, 1, 20, 100)), Math.floor(modulate(Math.sqrt(lowerAvgFr), 0, 1, 10, 60)), 20);
      
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
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }

    audio.play();
  };
}

window.onload = vizInit();
