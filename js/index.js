import * as THREE from '../plugins/Three/build/three.module.js';
import {
    OrbitControls
} from '../plugins/Three/module/jsm/controls/OrbitControls.js';
import {
    VRButton
} from '../plugins/Three/module/jsm/webxr/VRButton.js';
import {
    XRControllerModelFactory
} from '../plugins/Three/module/jsm/webxr/XRControllerModelFactory.js';

window.THREE = THREE
window.OrbitControls = OrbitControls
window.VRButton = VRButton
window.XRControllerModelFactory = XRControllerModelFactory