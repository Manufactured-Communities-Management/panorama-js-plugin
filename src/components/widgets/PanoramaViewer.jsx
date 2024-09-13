import {React, LeRed, LeUtils, ISSET, IS_ARRAY, ARRAY, IS_OBJECT, OBJECT, STRING, STRING_ANY, INT, INT_ANY, FLOAT, FLOAT_ANY, INT_LAX, INT_LAX_ANY, FLOAT_LAX, FLOAT_LAX_ANY, BROWSER_URL_QUERY, getBrowserUrlQuery, getBrowserUrlQueryUint, getBrowserUrlQueryBool, setBrowserUrlQuery, dispose, loadTextures, createCubeTexture, createCubeMaterial, getTexturePathsOfBasePath, PanoramaControls, PanoramaRenderer, stateVariations, AppStateSlices} from './../../../imports.js';
import {Error} from '../Error';


const getVisualViewportAspectRatio = () =>
{
	if(typeof window === 'undefined')
	{
		return 1;
	}
	const visualViewport = window.visualViewport;
	if(visualViewport)
	{
		return (visualViewport.width || 0) / Math.max(1, (visualViewport.height || 0));
	}
	return (window.innerWidth || 0) / Math.max(1, (window.innerHeight || 0));
};

const getDesiredHfov = () =>
{
	const aspectRatio = getVisualViewportAspectRatio();
	return Math.max(5, Math.min(120, 16.43 + (102.19 * aspectRatio) - (24.95 * aspectRatio * aspectRatio)));
};

const getMaximumHfov = () =>
{
	const aspectRatio = getVisualViewportAspectRatio();
	return Math.max(5, Math.min(120, 9.49 + (124.33 * aspectRatio)));
};

const getDesiredVfov = () =>
{
	return 95;
};

const getMaximumVfov = () =>
{
	return 130;
};


const saveYawPitch = (rotation) =>
{
	setBrowserUrlQuery({
		[BROWSER_URL_QUERY.YAW]:  Math.round(rotation.yaw * 100) / 100,
		[BROWSER_URL_QUERY.PITCH]:Math.round(rotation.pitch * 100) / 100,
	});
};


export const PanoramaViewer = ({src, hotspots = [], className = '', ...other}) =>
{
	const hotspotsRef = LeRed.useRef(hotspots);
	const firstHotspotsRef = LeRed.useRef(true);
	
	const fadeDelay = 200;
	const fadeDuration = 400;
	
	const srcBaseImagePaths = LeRed.useMemo(() => LeUtils.flattenArray(LeUtils.map(src, item => !ISSET(item.maskBasePath) ? [item.basePath + '/0.ktx2'] : [item.basePath + '/0.ktx2', item.maskBasePath + '/0.ktx2'])), [src]);
	const [srcBaseImages, srcBaseImagesLoading, srcBaseImagesError] = LeRed.useExternalBlob(srcBaseImagePaths);
	
	const [srcToRender, setSrcToRender] = LeRed.useState([]);
	const [hotspotsToRender, setHotspotsToRender] = LeRed.useState([]);
	
	
	LeRed.useEffect(() =>
	{
		if(src.length && !srcBaseImagesLoading)
		{
			setSrcToRender(src);
		}
	}, [src, srcBaseImagesLoading]);
	
	
	LeRed.useEffect(() =>
	{
		if(srcBaseImagesLoading)
		{
			return;
		}
		
		if(firstHotspotsRef.current)
		{
			if(!hotspots)
			{
				return;
			}
			firstHotspotsRef.current = false;
			hotspotsRef.current = hotspots;
			setHotspotsToRender(hotspotsRef.current);
			return;
		}
		
		if(!LeUtils.equals(hotspotsRef.current, hotspots))
		{
			hotspotsRef.current = [];
			setHotspotsToRender(hotspotsRef.current);
			return LeUtils.setTimeout(() =>
			{
				hotspotsRef.current = hotspots;
				setHotspotsToRender(hotspotsRef.current);
			}, fadeDuration + fadeDelay).remove;
		}
	}, [hotspots, srcBaseImagesLoading]);
	
	
	if(srcBaseImagesError)
	{
		return (<>
			<Error>
				Couldn't load scene: {getBrowserUrlQuery(BROWSER_URL_QUERY.SCENE)}<br/>
				<br/>
				{srcBaseImagesError}
			</Error>
		</>);
	}
	return (<>
		<div className={'app-widget-panorama-viewer ' + (className ?? '')} {...other}>
			<PanoramaRenderer src={srcToRender} hotspots={setHotspotsToRender} minFov={10} maxFov={getMaximumVfov()} initialFov={getDesiredVfov()} initialCameraRotation={{yaw:FLOAT_LAX(getBrowserUrlQuery(BROWSER_URL_QUERY.YAW)), pitch:FLOAT_LAX(getBrowserUrlQuery(BROWSER_URL_QUERY.PITCH))}} onCameraRotationChanged={saveYawPitch}/>
		</div>
	</>);
};
