import {LeRed} from '@lowentry/react-redux';
import {LeUtils, FLOAT_LAX_ANY} from '@lowentry/utils';
import {MathUtils} from 'three';
import {useFrame, useThree} from '@react-three/fiber';


export const PanoramaControls = LeRed.memo(({minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed:givenLookSpeed, lookSpeedX:givenLookSpeedX, lookSpeedY:givenLookSpeedY, zoomSpeed:givenZoomSpeed}) =>
{
	const ROTATION_SPEED = 0.0012;
	const ROTATION_DRAG_WHEN_SLIDING = 0.05;
	const ROTATION_DRAG_WHEN_DRAGGING = 0.3;
	const FOV_SCROLL_SPEED = 0.05;
	
	
	const lookSpeed = LeRed.useRef();
	const lookSpeedX = LeRed.useRef();
	const lookSpeedY = LeRed.useRef();
	const zoomSpeed = LeRed.useRef();
	lookSpeed.current = FLOAT_LAX_ANY(givenLookSpeed, 1);
	lookSpeedX.current = FLOAT_LAX_ANY(givenLookSpeedX, 1);
	lookSpeedY.current = FLOAT_LAX_ANY(givenLookSpeedY, 1);
	zoomSpeed.current = FLOAT_LAX_ANY(givenZoomSpeed, 1);
	
	const cameraMinFov = LeRed.useRef();
	const cameraMaxFov = LeRed.useRef();
	cameraMinFov.current = FLOAT_LAX_ANY(minFov, 1);
	cameraMaxFov.current = FLOAT_LAX_ANY(maxFov, 179);
	const clampFov = (fov) => Math.min(cameraMaxFov.current, Math.max(cameraMinFov.current, FLOAT_LAX_ANY(fov, 90)));
	
	const {gl, camera, invalidate} = useThree();
	const isDragging = LeRed.useRef(false);
	const startMousePosition = LeRed.useRef({x:0, y:0});
	const startCameraRotation = LeRed.useRef({yaw:FLOAT_LAX_ANY(initialCameraRotation?.yaw, 0), pitch:FLOAT_LAX_ANY(initialCameraRotation?.pitch, 0)});
	const cameraRotation = LeRed.useRef(LeUtils.clone(startCameraRotation.current));
	const lastCameraRotationCallbackParams = LeRed.useRef();
	const cameraRotationSpeed = LeRed.useRef({yaw:0, pitch:0});
	const cameraFov = LeRed.useRef(clampFov(initialFov));
	const lastCameraFovCallbackParams = LeRed.useRef();
	const cameraFovRotationSpeedMultiplier = () => (cameraFov.current / 90);
	
	
	const handleMouseDown = LeRed.useCallback((event) =>
	{
		event.stopPropagation?.();
		event.preventDefault?.();
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
			yaw:  startCameraRotation.current.yaw + (deltaX * ROTATION_SPEED * lookSpeed.current * lookSpeedX.current * cameraFovRotationSpeedMultiplier()),
			pitch:MathUtils.clamp(startCameraRotation.current.pitch + (deltaY * ROTATION_SPEED * lookSpeed.current * lookSpeedY.current * cameraFovRotationSpeedMultiplier()), -Math.PI / 2, Math.PI / 2),
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
		event.stopPropagation?.();
		event.preventDefault?.();
		cameraFov.current = clampFov(cameraFov.current + (FLOAT_LAX_ANY(event.deltaY, 0) * FOV_SCROLL_SPEED * zoomSpeed.current));
	}, []);
	
	
	LeRed.useEffectAnimationFrameInterval(() =>
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
		
		if(Math.abs(cameraRotationSpeed.current.yaw) < 0.0001)
		{
			cameraRotationSpeed.current.yaw = 0;
		}
		if(Math.abs(cameraRotationSpeed.current.pitch) < 0.0001)
		{
			cameraRotationSpeed.current.pitch = 0;
		}
		
		if((cameraRotation.current.yaw !== camera.rotation.y) || (cameraRotation.current.pitch !== camera.rotation.x))
		{
			camera.rotation.order = 'YXZ'; // yaw first, then pitch
			camera.rotation.y = cameraRotation.current.yaw;
			camera.rotation.x = cameraRotation.current.pitch;
			invalidate();
			
			const roundedRotation = {yaw:Math.round(cameraRotation.current.yaw * 1000) / 1000, pitch:Math.round(cameraRotation.current.pitch * 1000) / 1000};
			if(!LeUtils.equals(lastCameraRotationCallbackParams.current, roundedRotation))
			{
				lastCameraRotationCallbackParams.current = roundedRotation;
				onCameraRotationChanged?.(LeUtils.clone(roundedRotation));
			}
		}
		
		if(('fov' in camera) && (cameraFov.current !== camera.fov))
		{
			camera.fov = FLOAT_LAX_ANY(cameraFov.current, 90);
			camera.updateProjectionMatrix();
			invalidate();
			
			const roundedFov = Math.round(cameraFov.current * 10) / 10;
			if(!LeUtils.equals(lastCameraFovCallbackParams.current, roundedFov))
			{
				lastCameraFovCallbackParams.current = roundedFov;
				onFovChanged?.(roundedFov);
			}
		}
	}, [camera, invalidate]);
	
	
	LeRed.useEffect(() =>
	{
		const domElement = gl.domElement;
		
		domElement.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		//domElement.addEventListener('mouseleave', handleMouseUp); // stop dragging if the mouse leaves the canvas
		domElement.addEventListener('touchstart', handleMouseDown);
		document.addEventListener('touchmove', handleMouseMove);
		document.addEventListener('touchend', handleMouseUp);
		document.addEventListener('touchcancel', handleMouseUp);
		domElement.addEventListener('wheel', handleMouseScroll);
		domElement.addEventListener('pinch', handleMouseScroll);
		
		return () =>
		{
			domElement.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			//domElement.removeEventListener('mouseleave', handleMouseUp);
			domElement.removeEventListener('touchstart', handleMouseDown);
			document.removeEventListener('touchmove', handleMouseMove);
			document.removeEventListener('touchend', handleMouseUp);
			document.removeEventListener('touchcancel', handleMouseUp);
			domElement.removeEventListener('wheel', handleMouseScroll);
			domElement.removeEventListener('pinch', handleMouseScroll);
		};
	}, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseScroll]);
	
	
	return null;
});
