import {LeRed} from '@lowentry/react-redux';
import {LeUtils, FLOAT_LAX_ANY} from '@lowentry/utils';
import {MathUtils} from 'three';
import {PerspectiveCamera} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';


export const PanoramaControls = LeRed.memo(({minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged}) =>
{
	const ROTATION_SPEED = 0.0012;
	const ROTATION_DRAG_WHEN_SLIDING = 0.05;
	const ROTATION_DRAG_WHEN_DRAGGING = 0.3;
	const FOV_SCROLL_SPEED = 0.05;
	
	
	const cameraMinFov = LeRed.useRef();
	const cameraMaxFov = LeRed.useRef();
	cameraMinFov.current = FLOAT_LAX_ANY(minFov, 1);
	cameraMaxFov.current = FLOAT_LAX_ANY(maxFov, 179);
	const clampFov = (fov) => Math.min(cameraMaxFov.current, Math.max(cameraMinFov.current, FLOAT_LAX_ANY(fov, 90)));
	
	const {camera, gl} = useThree();
	const isDragging = LeRed.useRef(false);
	const startMousePosition = LeRed.useRef({x:0, y:0});
	const startCameraRotation = LeRed.useRef({yaw:FLOAT_LAX_ANY(initialCameraRotation?.yaw, 0), pitch:FLOAT_LAX_ANY(initialCameraRotation?.pitch, 0)});
	const cameraRotation = LeRed.useRef(LeUtils.clone(startCameraRotation.current));
	const cameraRotationSpeed = LeRed.useRef({yaw:0, pitch:0});
	const cameraFov = LeRed.useRef(clampFov(initialFov));
	const cameraFovRotationSpeedMultiplier = () => (cameraFov.current / 90);
	
	
	const handleMouseDown = LeRed.useCallback((event) =>
	{
		if(event.touches)
		{
			if(event.touches.length > 1)
			{
				handleMouseUp();
				return;
			}
			if(event.touches.length <= 0)
			{
				handleMouseUp();
				return;
			}
			event = event.touches[0];
		}
		isDragging.current = true;
		startMousePosition.current = {x:event.clientX, y:event.clientY};
		startCameraRotation.current = {yaw:cameraRotation.current.yaw, pitch:cameraRotation.current.pitch};
	}, []);
	
	const handleMouseMove = LeRed.useCallback((event) =>
	{
		if(!isDragging.current)
		{
			return;
		}
		if(event.touches)
		{
			if(event.touches.length > 1)
			{
				handleMouseUp();
				return;
			}
			if(event.touches.length <= 0)
			{
				handleMouseUp();
				return;
			}
			event = event.touches[0];
		}
		const deltaX = event.clientX - startMousePosition.current.x;
		const deltaY = event.clientY - startMousePosition.current.y;
		const newCameraRotation = {
			yaw:  startCameraRotation.current.yaw + (deltaX * ROTATION_SPEED * cameraFovRotationSpeedMultiplier()),
			pitch:MathUtils.clamp(startCameraRotation.current.pitch + (deltaY * ROTATION_SPEED * cameraFovRotationSpeedMultiplier()), -Math.PI / 2, Math.PI / 2),
		};
		cameraRotationSpeed.current = {
			yaw:  newCameraRotation.yaw - cameraRotation.current.yaw,
			pitch:newCameraRotation.pitch - cameraRotation.current.pitch,
		};
		cameraRotation.current = newCameraRotation;
	}, []);
	
	const handleMouseUp = LeRed.useCallback((event) =>
	{
		isDragging.current = false;
		if(event && event.touches && (event.touches.length === 1))
		{
			handleMouseDown(event);
		}
	}, []);
	
	const handleMouseScroll = LeRed.useCallback((event) =>
	{
		cameraFov.current = clampFov(cameraFov.current + (FLOAT_LAX_ANY(event.deltaY, 0) * FOV_SCROLL_SPEED));
	}, []);
	
	
	useFrame(() =>
	{
		if(!isDragging.current)
		{
			cameraRotation.current = {
				yaw:  cameraRotation.current.yaw + cameraRotationSpeed.current.yaw,
				pitch:MathUtils.clamp(cameraRotation.current.pitch + cameraRotationSpeed.current.pitch, -Math.PI / 2, Math.PI / 2),
			};
			cameraRotationSpeed.current.yaw *= (1 - ROTATION_DRAG_WHEN_SLIDING);
			cameraRotationSpeed.current.pitch *= (1 - ROTATION_DRAG_WHEN_SLIDING);
		}
		else
		{
			cameraRotationSpeed.current.yaw *= 1 - ROTATION_DRAG_WHEN_DRAGGING;
			cameraRotationSpeed.current.pitch *= 1 - ROTATION_DRAG_WHEN_DRAGGING;
		}
		
		if((cameraRotation.current.yaw !== camera.rotation.y) || (cameraRotation.current.pitch !== camera.rotation.x))
		{
			camera.rotation.order = 'YXZ'; // yaw first, then pitch
			camera.rotation.y = cameraRotation.current.yaw;
			camera.rotation.x = cameraRotation.current.pitch;
			onCameraRotationChanged?.(LeUtils.clone(cameraRotation.current));
		}
		
		if(camera instanceof PerspectiveCamera)
		{
			if(cameraFov.current !== camera.fov)
			{
				camera.fov = FLOAT_LAX_ANY(cameraFov.current, 90);
				camera.updateProjectionMatrix();
				onFovChanged?.(cameraFov.current);
			}
		}
	});
	
	
	LeRed.useEffect(() =>
	{
		const domElement = gl.domElement;
		
		domElement.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		//domElement.addEventListener('mouseleave', handleMouseUp); // stop dragging if the mouse leaves the canvas
		document.addEventListener('touchstart', handleMouseDown);
		document.addEventListener('touchmove', handleMouseMove);
		document.addEventListener('touchend', handleMouseUp);
		document.addEventListener('touchcancel', handleMouseUp);
		document.addEventListener('wheel', handleMouseScroll);
		
		return () =>
		{
			domElement.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			//domElement.removeEventListener('mouseleave', handleMouseUp);
			document.removeEventListener('touchstart', handleMouseDown);
			document.removeEventListener('touchmove', handleMouseMove);
			document.removeEventListener('touchend', handleMouseUp);
			document.removeEventListener('touchcancel', handleMouseUp);
			document.removeEventListener('wheel', handleMouseScroll);
		};
	}, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseScroll]);
	
	
	return null;
});
