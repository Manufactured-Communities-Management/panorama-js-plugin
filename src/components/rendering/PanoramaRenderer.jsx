import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET, FLOAT_LAX, FLOAT_LAX_ANY} from '@lowentry/utils';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaRendererTexturePreloader} from './PanoramaRendererTexturePreloader.jsx';
import {useFadeoutAnimation} from '../utils/PanoramaReactUtils.jsx';


const FADE_BETWEEN_LOCATIONS = true;

const FADEOUT_DELAY_MS = 200;
const FADEOUT_DURATION_MS = 800;
const FADEOUT_DURATION_DECAY_FACTOR = Math.pow(0.01, 1 / (FADEOUT_DURATION_MS / 1000));
const FADEOUT_DURATION_LINEAR = false;


export const PanoramaRenderer = LeRed.memo(({initialFov:givenInitialFov, onFovChanged:givenOnFovChanged, ...props}) =>
{
	const {getErrorWidget, getLoadingWidget} = props;
	
	const [renderId, setRenderId] = LeRed.useState(LeUtils.uniqueId());
	
	const [initialLoading, setInitialLoading] = LeRed.useState(true);
	const [error, setError] = LeRed.useState(null);
	
	const layersRef = LeRed.useRef([]);
	
	const [initialFov, setInitialFov] = LeRed.useState(null);
	
	
	const onFovChanged = LeRed.useCallback(newFov =>
	{
		setInitialFov(newFov);
		givenOnFovChanged?.(newFov);
	}, [givenOnFovChanged]);
	
	
	LeRed.useEffect(() =>
	{
		if(givenInitialFov)
		{
			setInitialFov(givenInitialFov);
		}
	}, [givenInitialFov]);
	
	
	LeRed.useMemo(() =>
	{
		if(!FADE_BETWEEN_LOCATIONS && (layersRef.current.length > 0))
		{
			return;
		}
		const key = LeUtils.uniqueId();
		
		const setLoading = (isLoading) =>
		{
			if(isLoading)
			{
				return;
			}
			const layer = LeUtils.find(layersRef.current, layer => (layer.props.key === key));
			if(layer && layer.props.loading)
			{
				layer.props.loading = false;
				setRenderId(LeUtils.uniqueId());
				setInitialLoading(false);
				
				LeUtils.setTimeout(() =>
				{
					const index = LeUtils.findIndex(layersRef.current, layer => (layer.props.key === key));
					if(index > 0)
					{
						layersRef.current.splice(0, index);
						setRenderId(LeUtils.uniqueId());
					}
				}, FADEOUT_DELAY_MS + FADEOUT_DURATION_MS + 200);
			}
		};
		
		layersRef.current.push({props:{key, loading:true, setLoading, setError}, givenProps:props});
	}, [props?.homeUrl, props?.locationIndex]);
	
	
	LeRed.useMemo(() =>
	{
		LeUtils.each(layersRef.current, layer =>
		{
			if(!FADE_BETWEEN_LOCATIONS || ((layer.givenProps.homeUrl === props.homeUrl) && (layer.givenProps.locationIndex === props.locationIndex)))
			{
				layer.givenProps = props;
			}
		});
	}, [props]);
	
	
	if(error)
	{
		return getErrorWidget(error);
	}
	
	return (<>
		{!!initialLoading && getLoadingWidget()}
		<div style={{position:'relative', width:'100%', height:'100%', overflow:'hidden', ...(!initialLoading ? {} : {width:'1px', height:'1px', opacity:'0'})}}>
			{LeUtils.mapToArray(layersRef.current, layer => (
				<PanoramaRendererAtLocation {...layer.givenProps} {...layer.props} initialFov={initialFov} onFovChanged={onFovChanged}/>
			))}
		</div>
	</>);
});


const PanoramaRendererAtLocation = LeRed.memo(({loading, setLoading, setError, src, homeId, host, homeUrl, variations, styleIndex, locationIndex, basisTranscoderPath, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation:givenInitialCameraRotation, onCameraRotationChanged:givenOnCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed, getErrorWidget, getLoadingWidget}) =>
{
	const [movedCamera, setMovedCamera] = LeRed.useState(false);
	
	const {opacity:fadeoutOpacity} = useFadeoutAnimation({visible:loading, delay:FADEOUT_DELAY_MS, duration:FADEOUT_DURATION_LINEAR ? FADEOUT_DURATION_MS : null, decayFactor:FADEOUT_DURATION_LINEAR ? null : FADEOUT_DURATION_DECAY_FACTOR});
	const opacity = (1 - (fadeoutOpacity / (movedCamera ? 3 : 1)));
	const controlsMultiplier = (opacity < 0.8) ? 0 : 1;
	
	const opacityRef = LeRed.useRef();
	opacityRef.current = opacity;
	
	
	const initialCameraRotation = LeRed.useMemo(() =>
	{
		if(ISSET(givenInitialCameraRotation?.yaw) && ISSET(givenInitialCameraRotation?.pitch))
		{
			return givenInitialCameraRotation;
		}
		const location = variations?.locations?.[locationIndex];
		if(ISSET(location?.desiredRotation))
		{
			return {yaw:FLOAT_LAX(location?.desiredRotation), pitch:0};
		}
		return {yaw:FLOAT_LAX(location?.recommendedRotation?.yaw), pitch:FLOAT_LAX(location?.recommendedRotation?.pitch)};
	}, [givenInitialCameraRotation, variations?.locations?.[locationIndex]]);
	
	
	const onCameraRotationChanged = LeRed.useCallback(newRotation =>
	{
		if(opacityRef.current >= 0.8)
		{
			setMovedCamera(true);
		}
		givenOnCameraRotationChanged?.(newRotation);
	}, [givenOnCameraRotationChanged]);
	
	
	return (<>
		<div style={{position:'absolute', width:'100%', height:'100%', overflow:'hidden', ...(!loading ? {opacity} : {width:'1px', height:'1px', opacity:'0'})}}>
			<Canvas flat={true} linear={true} shadows={false} frameloop="demand" gl={{precision:'highp', antialias:false, depth:false, stencil:false}}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={FLOAT_LAX_ANY(lookSpeed, 1) * controlsMultiplier} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={FLOAT_LAX_ANY(zoomSpeed, 1) * controlsMultiplier}/>
				
				<PanoramaRendererTexturePreloader src={src} homeId={homeId} host={host} homeUrl={homeUrl} styleIndex={styleIndex} locationIndex={locationIndex} basisTranscoderPath={basisTranscoderPath} setLoading={setLoading} setError={setError}/>
			</Canvas>
		</div>
	</>);
});
