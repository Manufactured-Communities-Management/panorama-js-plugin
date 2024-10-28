import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET, FLOAT_LAX, FLOAT_LAX_ANY, STRING} from '@lowentry/utils';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaRendererTexturePreloader} from './PanoramaRendererTexturePreloader.jsx';
import {useFadeoutAnimation} from '../utils/PanoramaReactUtils.jsx';
import {getSelectedVariationIndexesBySku, getTexturePathsToRender} from '../utils/PanoramaVariationParsingUtils.jsx';


const FADE_BETWEEN_LOCATIONS = true;

const FADEOUT_DELAY_MS = 200;
const FADEOUT_DURATION_MS = 800;
const FADEOUT_DURATION_DECAY_FACTOR = Math.pow(0.01, 1 / (FADEOUT_DURATION_MS / 1000));
const FADEOUT_DURATION_LINEAR = false;


export const PanoramaRenderer = LeRed.memo((props) =>
{
	const {getErrorWidget, getLoadingWidget} = props;
	
	const [renderId, setRenderId] = LeRed.useState(LeUtils.uniqueId());
	
	const [initialLoading, setInitialLoading] = LeRed.useState(true);
	
	const layersRef = LeRed.useRef([]);
	
	
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
		
		layersRef.current.push({props:{key, loading:true, setLoading}, givenProps:props});
	}, [props?.homeUrl, props?.locationId]);
	
	
	LeRed.useMemo(() =>
	{
		LeUtils.each(layersRef.current, layer =>
		{
			if(!FADE_BETWEEN_LOCATIONS || ((layer.givenProps.homeUrl === props.homeUrl) && (layer.givenProps.locationId === props.locationId)))
			{
				layer.givenProps = props;
			}
		});
	}, [props]);
	
	
	return (<>
		{!!initialLoading && getLoadingWidget()}
		<div style={{position:'relative', width:'100%', height:'100%', overflow:'hidden', ...(!initialLoading ? {} : {width:'1px', height:'1px', opacity:'0'})}}>
			{LeUtils.mapToArray(layersRef.current, layer => (
				<PanoramaRendererAtLocation {...layer.givenProps} {...layer.props}/>
			))}
		</div>
	</>);
});


const PanoramaRendererAtLocation = LeRed.memo(({loading, setLoading, homeId, host, homeUrl, variations, skus, styleId:givenStyleId, locationId, basisTranscoderPath, minFov, maxFov, calculateFov, onFovChanged, initialCameraRotation:givenInitialCameraRotation, onCameraRotationChanged:givenOnCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed, getErrorWidget, getLoadingWidget}) =>
{
	const [movedCamera, setMovedCamera] = LeRed.useState(false);
	
	const {opacity:fadeoutOpacity} = useFadeoutAnimation({visible:loading, delay:FADEOUT_DELAY_MS, duration:FADEOUT_DURATION_LINEAR ? FADEOUT_DURATION_MS : null, decayFactor:FADEOUT_DURATION_LINEAR ? null : FADEOUT_DURATION_DECAY_FACTOR});
	const opacity = (1 - (fadeoutOpacity / (movedCamera ? 3 : 1)));
	const controlsMultiplier = (opacity < 0.8) ? 0 : 1;
	
	const opacityRef = LeRed.useRef();
	opacityRef.current = opacity;
	
	const [error, setError] = LeRed.useState(null);
	
	
	let styleId = givenStyleId;
	
	const styles = variations?.styles;
	const locations = LeRed.useMemo(() => styleId ? variations?.locations?.filter(location => LeUtils.contains(location?.supportedStyleIds, styleId)) : variations?.locations, [variations?.locations, styleId]);
	
	const locationIndex = LeRed.useMemo(() => locationId ? LeUtils.findIndex(locations, location => (location?.locationId === locationId)) : 0, [locations, locationId]);
	if(!styleId)
	{
		styleId = STRING(locations?.[locationIndex]?.supportedStyleIds?.[0]);
	}
	const styleIndex = LeRed.useMemo(() => styleId ? LeUtils.findIndex(styles, style => (style?.styleId === styleId)) : 0, [styles, styleId]);
	
	const variationGroups = styles?.[styleIndex]?.variationGroups;
	const locationVariationGroups = locations?.[locationIndex]?.variationGroups;
	
	const selectedVariationIndexes = LeRed.useMemo(() => getSelectedVariationIndexesBySku(variationGroups, skus), [variationGroups, skus]);
	const src = LeRed.useMemo(() => getTexturePathsToRender(variationGroups, selectedVariationIndexes, locationVariationGroups, styleIndex, locationIndex, homeUrl), [variationGroups, selectedVariationIndexes, locationVariationGroups, styleIndex, locationIndex, homeUrl]);
	
	
	const initialCameraRotation = LeRed.useMemo(() =>
	{
		if(ISSET(givenInitialCameraRotation?.yaw) && ISSET(givenInitialCameraRotation?.pitch))
		{
			return givenInitialCameraRotation;
		}
		const location = locations?.[locationIndex];
		if(ISSET(location?.desiredRotation))
		{
			return {yaw:FLOAT_LAX(location?.desiredRotation), pitch:0};
		}
		return {yaw:FLOAT_LAX(location?.recommendedRotation?.yaw), pitch:FLOAT_LAX(location?.recommendedRotation?.pitch)};
	}, [givenInitialCameraRotation, locations?.[locationIndex]?.desiredRotation, locations?.[locationIndex]?.recommendedRotation]);
	
	const onCameraRotationChanged = LeRed.useCallback(newRotation =>
	{
		if(opacityRef.current >= 0.8)
		{
			setMovedCamera(true);
		}
		givenOnCameraRotationChanged?.(newRotation);
	}, [givenOnCameraRotationChanged]);
	
	
	const errorComponent = LeRed.useMemo(() =>
	{
		if(error)
		{
			return getErrorWidget(error);
		}
		if(!styles || !locations)
		{
			return getErrorWidget({canRetry:false, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:'the home data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{homeId, host, homeUrl, variations}});
		}
		if(styleId && locationId && (!ISSET(styleIndex) || !(styleIndex in styles) || !ISSET(locationIndex) || !(locationIndex in locations)))
		{
			return getErrorWidget({canRetry:false, id:'invalid-location-and-style-id', message:'Invalid location and style ID: ' + locationId + ' and ' + styleId, reason:'the location and style ID combination doesn\'t exist in the home', data:{homeId, host, homeUrl, variations, styleId, locationId}});
		}
		if(!ISSET(styleIndex) || !(styleIndex in styles))
		{
			return getErrorWidget({canRetry:false, id:'invalid-style-id', message:'Invalid style ID: ' + styleId, reason:'the style ID doesn\'t exist in the home', data:{homeId, host, homeUrl, variations, styleId}});
		}
		if(!ISSET(locationIndex) || !(locationIndex in locations))
		{
			return getErrorWidget({canRetry:false, id:'invalid-location-id', message:'Invalid location ID: ' + locationId, reason:'the location ID doesn\'t exist in the home', data:{homeId, host, homeUrl, variations, locationId}});
		}
		if(!variationGroups || !locationVariationGroups)
		{
			return getErrorWidget({canRetry:false, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:'the home data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{homeId, host, homeUrl, variations}});
		}
	}, [error, styles, locations, styleId, locationId, styleIndex, locationIndex, variationGroups, locationVariationGroups, homeId, host, homeUrl, variations, getErrorWidget]);
	
	
	return (<>
		<div style={{position:'absolute', width:'100%', height:'100%', overflow:'hidden', ...(!loading ? {opacity} : {width:'1px', height:'1px', opacity:'0'})}}>
			{errorComponent || (
				<Canvas flat={true} linear={true} shadows={false} frameloop="demand" gl={{precision:'highp', antialias:false, depth:false, stencil:false}}>
					<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
					<PanoramaControls minFov={minFov} maxFov={maxFov} calculateFov={calculateFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={FLOAT_LAX_ANY(lookSpeed, 1) * controlsMultiplier} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={FLOAT_LAX_ANY(zoomSpeed, 1) * controlsMultiplier}/>
					
					<PanoramaRendererTexturePreloader src={src} homeId={homeId} host={host} homeUrl={homeUrl} styleIndex={styleIndex} locationIndex={locationIndex} basisTranscoderPath={basisTranscoderPath} setLoading={setLoading} setError={setError}/>
				</Canvas>
			)}
		</div>
	</>);
});
