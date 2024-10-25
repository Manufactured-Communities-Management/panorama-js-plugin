import {LeRed} from '@lowentry/react-redux';
import {LeUtils, FLOAT_LAX_ANY, FLOAT_LAX, ISSET} from '@lowentry/utils';
import {MathUtils} from 'three';
import {useThree} from '@react-three/fiber';


export const PanoramaControls = LeRed.memo(({minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed:givenLookSpeed, lookSpeedX:givenLookSpeedX, lookSpeedY:givenLookSpeedY, zoomSpeed:givenZoomSpeed}) =>
{
	const CUBEMAP_YAW_OFFSET = 90;
	
	const ROTATION_SPEED = 0.0012;
	const ROTATION_TOUCH_SPEED_MULTIPLIER = 2.0;
	const ROTATION_SLIDING_DISTANCE = 60;
	const ROTATION_DRAG_WHEN_SLIDING = 0.95393;
	const ROTATION_DRAG_WHEN_DRAGGING = 0.9999999995;
	const FOV_SCROLL_SPEED = 0.05;
	const FOV_TOUCH_SPEED_MULTIPLIER = 600;
	const ROTATION_ANIMATION_SPEED = 2;
	
	
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
	
	const onCameraRotationChangedRef = LeRed.useRef();
	onCameraRotationChangedRef.current = onCameraRotationChanged;
	
	const {gl, camera, invalidate} = useThree();
	const isDragging = LeRed.useRef(false);
	const lastMousePosition = LeRed.useRef({x:0, y:0});
	const startMousePosition = LeRed.useRef({x:0, y:0});
	const startCameraRotation = LeRed.useRef();
	const cameraRotation = LeRed.useRef();
	const cameraRotationGoal = LeRed.useRef();
	const lastCameraRotationCallbackParams = LeRed.useRef();
	const cameraRotationSpeed = LeRed.useRef({yaw:0, pitch:0});
	const cameraFov = LeRed.useRef(clampFov(initialFov));
	const lastCameraFovCallbackParams = LeRed.useRef();
	const lastTouchDistance = LeRed.useRef(null);
	const cameraFovRotationSpeedMultiplier = () => (cameraFov.current / 90);
	
	
	LeRed.useMemo(() =>
	{
		startMousePosition.current = lastMousePosition.current;
		startCameraRotation.current = cameraRotation.current;
	}, [lookSpeed.current, lookSpeedX.current, lookSpeedY.current]);
	
	
	const setInitialCameraRotation = (rotation, instant) =>
	{
		const newRotation = {yaw:MathUtils.degToRad(FLOAT_LAX_ANY(rotation?.yaw, 0) - CUBEMAP_YAW_OFFSET), pitch:MathUtils.clamp(MathUtils.degToRad(FLOAT_LAX_ANY(rotation?.pitch, 0)), -Math.PI / 2, Math.PI / 2)};
		if(instant)
		{
			cameraRotation.current = newRotation;
			cameraRotationGoal.current = null;
		}
		else
		{
			cameraRotationGoal.current = newRotation;
		}
		isDragging.current = false;
		cameraRotationSpeed.current = {yaw:0, pitch:0};
	};
	
	LeRed.useEffect(() =>
	{
		setInitialCameraRotation(initialCameraRotation, true);
	}, []);
	
	LeRed.useEffect(() =>
	{
		if(ISSET(initialCameraRotation))
		{
			setInitialCameraRotation(initialCameraRotation);
		}
	}, [initialCameraRotation]);
	
	
	const handleMouseScroll = LeRed.useCallback((event) =>
	{
		event.stopPropagation?.();
		event.preventDefault?.();
		cameraFov.current = clampFov(cameraFov.current + (FLOAT_LAX_ANY(event.deltaY, 0) * FOV_SCROLL_SPEED * zoomSpeed.current));
	}, []);
	
	
	const handleMouseDown = LeRed.useCallback((event) =>
	{
		event.stopPropagation?.();
		event.preventDefault?.();
		if(cameraRotationGoal.current)
		{
			return;
		}
		if(event.touches)
		{
			if(event.touches.length > 1)
			{
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
		lastMousePosition.current = {x:event.clientX, y:event.clientY};
		startMousePosition.current = {x:event.clientX, y:event.clientY};
		startCameraRotation.current = {yaw:cameraRotation.current.yaw, pitch:cameraRotation.current.pitch};
	}, []);
	
	const handleMouseMove = LeRed.useCallback((event) =>
	{
		if(!isDragging.current)
		{
			return;
		}
		const isTouchEvent = !!event.touches;
		if(event.touches)
		{
			const lastTouchDistanceValue = lastTouchDistance.current;
			lastTouchDistance.current = null;
			if(event.touches.length > 1)
			{
				if(event.touches.length === 2)
				{
					lastTouchDistance.current = FLOAT_LAX(Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY));
					if(lastTouchDistanceValue !== null)
					{
						handleMouseScroll({deltaY:((lastTouchDistanceValue - lastTouchDistance.current) / lastTouchDistanceValue) * FOV_TOUCH_SPEED_MULTIPLIER});
					}
				}
				return;
			}
			if(event.touches.length <= 0)
			{
				handleMouseUp();
				return;
			}
			event = event.touches[0];
		}
		lastMousePosition.current = {x:event.clientX, y:event.clientY};
		const deltaX = event.clientX - startMousePosition.current.x;
		const deltaY = event.clientY - startMousePosition.current.y;
		const newCameraRotation = {
			yaw:  startCameraRotation.current.yaw + (deltaX * ROTATION_SPEED * (isTouchEvent ? ROTATION_TOUCH_SPEED_MULTIPLIER : 1) * lookSpeed.current * lookSpeedX.current * cameraFovRotationSpeedMultiplier()),
			pitch:MathUtils.clamp(startCameraRotation.current.pitch + (deltaY * ROTATION_SPEED * (isTouchEvent ? ROTATION_TOUCH_SPEED_MULTIPLIER : 1) * lookSpeed.current * lookSpeedY.current * cameraFovRotationSpeedMultiplier()), -Math.PI / 2, Math.PI / 2),
		};
		cameraRotationSpeed.current = {
			yaw:  (newCameraRotation.yaw - cameraRotation.current.yaw) * ROTATION_SLIDING_DISTANCE,
			pitch:(newCameraRotation.pitch - cameraRotation.current.pitch) * ROTATION_SLIDING_DISTANCE,
		};
		cameraRotation.current = newCameraRotation;
	}, []);
	
	const handleMouseUp = LeRed.useCallback((event) =>
	{
		isDragging.current = false;
		lastTouchDistance.current = null;
		if(event && event.touches && (event.touches.length === 1))
		{
			handleMouseDown(event);
		}
	}, []);
	
	
	LeRed.useEffectAnimationFrameInterval(deltaTime =>
	{
		deltaTime = Math.min(0.33, deltaTime); // at least 3 FPS  -  this is to prevent odd behavior (like when the tab is inactive for a long time)
		
		if(cameraRotationGoal.current)
		{
			let yawDiff = (MathUtils.radToDeg(cameraRotationGoal.current.yaw) - MathUtils.radToDeg(cameraRotation.current.yaw) + 360000) % 360;
			if(yawDiff > 180)
			{
				yawDiff -= 360;
			}
			yawDiff = MathUtils.degToRad(yawDiff);
			let pitchDiff = (cameraRotationGoal.current.pitch - cameraRotation.current.pitch);
			
			const distance = Math.sqrt((yawDiff * yawDiff) + (pitchDiff * pitchDiff));
			const applyDistance = Math.max(distance, 0.0001) * deltaTime * ROTATION_ANIMATION_SPEED;
			
			if(applyDistance >= (distance - 0.8))
			{
				cameraRotationSpeed.current = {yaw:yawDiff * 3, pitch:pitchDiff * 3};
				cameraRotationGoal.current = null;
			}
			else
			{
				const applyDistanceMultiplier = applyDistance / distance;
				cameraRotation.current = {
					yaw:  cameraRotation.current.yaw + (yawDiff * applyDistanceMultiplier),
					pitch:cameraRotation.current.pitch + (pitchDiff * applyDistanceMultiplier),
				};
			}
		}
		
		if(!isDragging.current)
		{
			cameraRotation.current = {
				yaw:  cameraRotation.current.yaw + (cameraRotationSpeed.current.yaw * deltaTime),
				pitch:MathUtils.clamp(cameraRotation.current.pitch + (cameraRotationSpeed.current.pitch * deltaTime), -Math.PI / 2, Math.PI / 2),
			};
			const drag = Math.pow(1 - ROTATION_DRAG_WHEN_SLIDING, deltaTime);
			cameraRotationSpeed.current.yaw *= drag;
			cameraRotationSpeed.current.pitch *= drag;
		}
		else
		{
			const drag = Math.pow(1 - ROTATION_DRAG_WHEN_DRAGGING, deltaTime);
			cameraRotationSpeed.current.yaw *= drag;
			cameraRotationSpeed.current.pitch *= drag;
		}
		
		if((cameraRotation.current.yaw !== camera.rotation.y) || (cameraRotation.current.pitch !== camera.rotation.x))
		{
			camera.rotation.order = 'YXZ'; // yaw first, then pitch
			camera.rotation.y = cameraRotation.current.yaw;
			camera.rotation.x = cameraRotation.current.pitch;
			invalidate();
			
			if(onCameraRotationChangedRef.current)
			{
				let yaw = MathUtils.radToDeg(cameraRotation.current.yaw);
				let pitch = MathUtils.radToDeg(cameraRotation.current.pitch);
				
				yaw += CUBEMAP_YAW_OFFSET;
				while(yaw < 0)
				{
					yaw += 360;
				}
				yaw %= 360;
				
				yaw = Math.round(yaw * 1000) / 1000;
				pitch = Math.round(pitch * 1000) / 1000;
				
				const roundedRotation = {yaw, pitch};
				if(!LeUtils.equals(lastCameraRotationCallbackParams.current, roundedRotation))
				{
					lastCameraRotationCallbackParams.current = roundedRotation;
					onCameraRotationChangedRef.current?.({yaw, pitch});
				}
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
		};
	}, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseScroll]);
	
	
	return null;
});
