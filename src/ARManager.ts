
import { WebGLRenderer, PerspectiveCamera, Vector3, Object3D } from "three";
import { ARButton } from 'three/addons/webxr/ARButton.js';

class ARManager {
    private hitTestSource: XRHitTestSource | null = null;
    private hitTestSourceRequested = false;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private contentObject: Object3D;

    constructor(renderer: WebGLRenderer, camera: PerspectiveCamera, content: any) {
        this.renderer = renderer;
        this.camera = camera;
        this.contentObject = content;
    }

    public setupAR() {
        // Add AR button to the scene
        document.body.appendChild(ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] }));
        this.renderer.xr.addEventListener('sessionstart', () => {
            console.log('AR session started');
            this.requestHitTestSource();
        });
    }

    public setContent(content: Object3D){
        this.contentObject = content;
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
                if(this.contentObject != null && this.contentObject.parent)
                    this.contentObject.parent.remove(this.contentObject);
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

                if (hitPose) {
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
