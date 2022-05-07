import * as THREE from '../plugins/Three/build/three.module.js';
import {
    OrbitControls
} from '../plugins/Three/module/jsm/controls/OrbitControls.js';
import {
    ColladaLoader
} from '../plugins/Three/module/jsm/loaders/ColladaLoader.js';
import {
    GLTFLoader
} from '../plugins/Three/module/jsm/loaders/GLTFLoader.js';
import {
    VRButton
} from '../plugins/Three/module/jsm/webxr/VRButton.js';
import {
    XRControllerModelFactory
} from '../plugins/Three/module/jsm/webxr/XRControllerModelFactory.js';

var container;
var camera, scene, renderer;
var controller1, controller2;
var controllerGrip1, controllerGrip2;

var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();

var controls, group;
var mixer

var box1, box2

init();
animate();

function init() {

    container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(2.4, 2.4, 0);

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
    box1 = createNumBtn('111', [-5, 0.4, 0])
    box2 = createNumBtn('222', [-5, 0.4, 1])
    scene.add(box1)
    scene.add(box2)
    // addText(box2)

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
            'sky.right.jpg', //右(-1,0,0)
            'sky.left.jpg', //左(1,0,0)
            'sky.top.jpg', //上(0,1,0)
            'sky.bottom.jpg', //下(0,-1,0)
            'sky.front.jpg', //前(0,0,1)
            'sky.back.jpg' //后(0,0,-1)
        ]);
    scene.background = texture
}

function createNumBtn(name, position) {
    var geometry = new THREE.BoxBufferGeometry(0.1, 0.6, 0.6);
    var material = new THREE.MeshBasicMaterial({
        color: '#303030'
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2])
    mesh.name = name
    return mesh
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onSelectStart(event) {

    var controller = event.target;

    var intersections = getIntersections(controller);

    if (intersections.length > 0) {

        var intersection = intersections[0];

        var object = intersection.object;
        object.material.emissive.b = 1;
        controller.attach(object);

        controller.userData.selected = object;

    }

}

function onSelectEnd(event) {

    var controller = event.target;

    if (controller.userData.selected !== undefined) {

        var object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach(object);
        addText(object)

        controller.userData.selected = undefined;

    }

}

function addText(val) {
    var text = JSON.stringify(val)
    var loader = new THREE.FontLoader();

    loader.load('../fonts/Microsoft_YaHei.json',function (data) {
        var geometry = new THREE.TextGeometry(text, {
            font: data,
            size: 0.05,
            height: 0.01
        });
        var meshMaterial = new THREE.MeshPhongMaterial({
            color: '#000'
        });
        var mesh = new THREE.Mesh(geometry, meshMaterial);
        mesh.position.set(-4, 0, 8);
        mesh.rotateY(Math.PI/2)
        console.log(mesh)
        scene.add(mesh);
    })
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
var clock = new THREE.Clock();

function render() {

    cleanIntersected();

    intersectObjects(controller1);
    intersectObjects(controller2);

    var delta = clock.getDelta();

    if (mixer !== undefined) {

        mixer.update(delta);

    }

    renderer.render(scene, camera);

}