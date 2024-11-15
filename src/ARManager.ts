
import { WebGLRenderer, PerspectiveCamera, Vector3, Object3D } from "three";
import { ARButton } from 'three/addons/webxr/ARButton.js';

class ARManager {
    private hitTestSource: XRHitTestSource | null = null;
    private hitTestSourceRequested = false;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private contentObject: Object3D | null = null;
    private arButton!: HTMLElement;

    constructor(renderer: WebGLRenderer, camera: PerspectiveCamera) {
        this.renderer = renderer;
        this.camera = camera;
    }

    public setupAR() {
        // Add AR button to the scene
        this.arButton = ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] });
        document.body.appendChild(this.arButton);
        this.renderer.xr.addEventListener('sessionstart', () => {
            console.log('AR session started');
            this.requestHitTestSource();
        });

        if(!this.contentObject){
            this.arButton.style.pointerEvents = "none";
            this.arButton.style.opacity = "0.5";
        }
    }

    public setContent(content: Object3D){
        this.contentObject = content;
        this.arButton.style.pointerEvents = "auto";
    }

    private requestHitTestSource() {
        const session = this.renderer.xr.getSession();
        if (session && !this.hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                (session as any).requestHitTestSource({ space: referenceSpace }).then((source: XRHitTestSource | null) => {
                    this.hitTestSource = source;
                });
            });

            this.hitTestSourceRequested = true;

            session.addEventListener('end', () => {
                this.hitTestSourceRequested = false;
                this.hitTestSource = null;
                // Try destroing last object
                if(this.contentObject != null && this.contentObject.parent){
                    this.contentObject.parent.remove(this.contentObject);
                    this.arButton.style.pointerEvents = "none";
                    this.contentObject = null;
                }
            });
        }
    }

    public trackHitSource(frame: XRFrame) {
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        // console.log(referenceSpace);
        if (referenceSpace && this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(referenceSpace);

                if (hitPose && this.contentObject) {
                    const newY = hitPose.transform.position.y;
                    const direction = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                    this.contentObject.position.set(
                        hitPose.transform.position.x,
                        newY,
                        hitPose.transform.position.z
                    );
                    this.contentObject.visible = true;
                }
            }
        }
    }
}

export default ARManager;
