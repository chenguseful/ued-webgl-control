import * as THREE from '../plugins/Three/build/three.module.js';
import { OrbitControls } from '../plugins/Three/module/jsm/controls/OrbitControls.js';
import { ColladaLoader } from '../plugins/Three/module/jsm/loaders/ColladaLoader.js';
import { GLTFLoader } from '../plugins/Three/module/jsm/loaders/GLTFLoader.js';
import { VRButton } from '../plugins/Three/module/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from '../plugins/Three/module/jsm/webxr/XRControllerModelFactory.js';

var container;
var camera, scene, renderer;
var controller1, controller2;
var controllerGrip1, controllerGrip2;

var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();

var controls, group;
var mixer

var clock = new THREE.Clock();

/*var waringTexture1 = new THREE.TextureLoader().load('../images/red.png')
var waringTexture2 = new THREE.TextureLoader().load('../images/yellow.png')
var waringTexture3 = new THREE.TextureLoader().load('../images/green.png')*/

var videoDom = document.getElementById( 'video' );
var videoMesh

//var box3

init();
animate();

function init() {

    container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(2.4, 2.4, 0);
    //camera.layers.enable( 0 ); //参考全景视频案例中添加，layers：当摄像机的视点被渲染的时候，物体必须和当前被看到的摄像机共享至少一个层

    controls = new OrbitControls(camera, container);
    controls.target.set(0, 1.6, 0);
    controls.update();

    scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 6, 0);
    light.castShadow = true;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = -2;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);

    var point = new THREE.PointLight(0xffffff, 1, 100);
    point.position.set(0, 0, 0);
    scene.add(point);

    group = new THREE.Group();
    scene.add(group);

    // 加载场景、模型
    addSky()
    initWelcome()
    initVideo()
    //loadModel()
    //loadAnimate()
    //loadVideo()
    //loadLabel()

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    document.body.appendChild(VRButton.createButton(renderer));

    // controllers

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    var controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    var geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);

    var line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 5;

    controller1.add(line.clone());
    controller2.add(line.clone());

    raycaster = new THREE.Raycaster();

    window.addEventListener('resize', onWindowResize, false);

}

function addSky() {
    const texture = new THREE.CubeTextureLoader()
        .setPath('../images/sky/')
        .load([
            'px.png', //右(-1,0,0)
            'nx.png', //左(1,0,0)
            'py.png', //上(0,1,0)
            'ny.png', //下(0,-1,0)
            'pz.png', //前(0,0,1)
            'nz.png' //后(0,0,-1)
        ]);
    scene.background = texture
}

function initWelcome() {
    var box = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.5, 0.6),
        new THREE.MeshStandardMaterial({  //物理材质
            color: 0x000000,
        })
    );
    box.name = 'welcome'
    box.position.set(0,2,0);
    box.castShadow = true;
    box.receiveShadow = true;
    //plane.rotateY(Math.PI / 2)
    group.add(box)

    /*var box2 = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.5, 0.6),
        new THREE.MeshStandardMaterial({  //物理材质
            color: 0xffffff,
        })
    );
    box2.name = 'test'
    box2.position.set(-6,2,-1);
    box2.castShadow = true;
    box2.receiveShadow = true;
    group.add(box2)

    box3 = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.5, 0.6),
        new THREE.MeshStandardMaterial({  //物理材质
            color: 0xff0000,
        })
    );
    box3.name = 'test2'
    box3.position.set(-3,2,-1);
    box3.visible = false
    scene.add(box3)*/
}

function initVideo(){
    //video.style.visibility ="hidden";
    //video.play();

    var texture = new THREE.Texture( videoDom );
    texture.generateMipmaps = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.format = THREE.RGBFormat;

    setInterval( function () {
        if ( video.readyState >= video.HAVE_CURRENT_DATA ) {
            texture.needsUpdate = true;
        }
    }, 1000 / 24 );

    // left
    var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
    // 反转x轴上的几何图形，使所有面都指向内部
    geometry.scale( - 1, 1, 1 );

    var uvs = geometry.attributes.uv.array;
    for ( var i = 0; i < uvs.length; i += 2 ) {
        uvs[ i ] *= 0.5;
    }

    var material = new THREE.MeshBasicMaterial( { map: texture } );

    videoMesh = new THREE.Mesh( geometry, material );
    videoMesh.rotation.y = - Math.PI / 2;
    videoMesh.layers.set( 1 ); // display in left eye only
    videoMesh.visible = false
    scene.add( videoMesh );

    // right
    var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
    geometry.scale( - 1, 1, 1 );

    var uvs = geometry.attributes.uv.array;

    for ( var i = 0; i < uvs.length; i += 2 ) {
        uvs[ i ] *= 0.5;
        uvs[ i ] += 0.5;
    }

    var material = new THREE.MeshBasicMaterial( { map: texture } );

    videoMesh = new THREE.Mesh( geometry, material );
    videoMesh.rotation.y = - Math.PI / 2;
    videoMesh.layers.set( 2 ); // display in right eye only
    videoMesh.visible = false
    scene.add( videoMesh );
}

function loadModel() {
    var loader = new GLTFLoader().setPath('../models/hall/');
    loader.load('scene.gltf', function (gltf) {
        const obj = gltf.scene
        obj.position.set(0, 10, 0)
        obj.scale.set(1, 1, 1)
        obj.rotateY(Math.PI / 2)
        scene.add(obj);
    });
}

function loadAnimate() {
    var loader = new GLTFLoader();
    loader.load('../models/animate/scene.gltf', function (gltf) {

        var animations = gltf.animations;
        var obj = gltf.scene;

        obj.scale.set(0.8, 0.8, 0.8)
        obj.position.set(-6, 0.4, -2.8)
        obj.rotateY(Math.PI / 2)

        mixer = new THREE.AnimationMixer(obj);
        mixer.clipAction(animations[0]).play();

        scene.add(obj);
    });
}

function loadVideo() {
    var video = document.getElementById('video');
    var VideoTexture = new THREE.VideoTexture(video);
    VideoTexture.minFilter = THREE.LinearFilter;
    VideoTexture.magFilter = THREE.LinearFilter;
    VideoTexture.format = THREE.RGBFormat;

    var planeGeometry = new THREE.PlaneGeometry(6.4, 4);
    var material = new THREE.MeshPhongMaterial({
        map: VideoTexture
    });

    material.side = THREE.DoubleSide;
    var mesh = new THREE.Mesh(planeGeometry, material);
    mesh.position.set(-7.41, 3.1, -0.1)
    mesh.rotateY(Math.PI/2)
    scene.add(mesh)
}

// 标签
function loadLabel() {
    const sm1 = new THREE.SpriteMaterial({
        map: waringTexture1,
        transparent: true
    })
    const sm2 = new THREE.SpriteMaterial({
        map: waringTexture2,
        transparent: true
    })
    const sm3 = new THREE.SpriteMaterial({
        map: waringTexture3,
        transparent: true
    })
    const H = 150
    const list = [
        {
            type: 'err',
            name: 'warn-sprite1',
            position: [-233.612,H,-101.407], //实际项目 position的位置应该是每个机柜的上方 100处
        },
        {
            type: 'warn',
            name: 'warn-sprite2',
            position: [-171.170,H,-334.979]
        },
        {
            type: 'err',
            name: 'warn-sprite4',
            position: [-65.664,H,-583.942], //实际项目 position的位置应该是每个机柜的上方 100处
        },
        {
            type: 'warn',
            name: 'warn-sprite5',
            position: [81.950,H,9.090]
        },
    ]
    const mobj = {
        err: sm1,
        warn: sm2,
        ok: sm3
    }
    const group = new THREE.Group()
    group.name = '告警图标'
    roomGroup.add(group)
    state.iconD = group

    list.forEach(e => {
        const sprite = new THREE.Sprite(mobj[e.type])
        sprite.name = e.name
        sprite.scale.set(30, 30, 30)
        sprite.position.set(e.position[0], e.position[1], e.position[2])
        group.add(sprite);
    })
    return this
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onSelectStart(event) {

    var controller = event.target;

    var intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

        var intersection = intersections[ 0 ];

        tempMatrix.getInverse( controller.matrixWorld );

        var object = intersection.object;
        object.matrix.premultiply( tempMatrix );
        object.matrix.decompose( object.position, object.quaternion, object.scale );
        object.material.emissive.b = 1;
        controller.add( object );

        controller.userData.selected = object;

    }

}

function onSelectEnd(event) {

    var controller = event.target;

    if ( controller.userData.selected !== undefined ) {

        var object = controller.userData.selected;
        object.matrix.premultiply( controller.matrixWorld );
        object.matrix.decompose( object.position, object.quaternion, object.scale );
        object.material.emissive.b = 0;

        group.add( object );

        if( object.name === 'welcome' ){
            videoMesh.visible = true
            videoDom.play();
        }

        controller.userData.selected = undefined;

    }
}

function getIntersections(controller) {

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(group.children);

}

function intersectObjects(controller) {

    if (controller.userData.selected !== undefined) return;

    var line = controller.getObjectByName('line');
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {

        var intersection = intersections[0];

        var object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);

        line.scale.z = intersection.distance;

    } else {

        line.scale.z = 5;

    }

}

function cleanIntersected() {

    while (intersected.length) {

        var object = intersected.pop();
        object.material.emissive.r = 0;

    }

}

function animate() {

    renderer.setAnimationLoop(render);

}


function render() {

    cleanIntersected();

    intersectObjects(controller1);
    intersectObjects(controller2);


   /* var delta = clock.getDelta();

    if (mixer !== undefined) {
        mixer.update(delta);
    }
*/
    renderer.render(scene, camera);

}
