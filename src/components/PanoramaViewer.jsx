import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaDefaultLoadingWidget} from './widgets/PanoramaDefaultLoadingWidget.jsx';
import {PanoramaDefaultErrorWidget} from './widgets/PanoramaDefaultErrorWidget.jsx';
import {PanoramaLoaderVariationsRetriever} from './loading/PanoramaLoaderVariationsRetriever.jsx';
import {getCorrectedGivenProps, isHostPrivate} from './utils/PanoramaPropsParsingUtils.jsx';


/**
 * @exports
 * @typedef {Object} PanoramaViewerProps
 * @property {string} homeId
 * @property {string|null} [homeVersion]
 * @property {string|null} [host]
 * @property {string|null} [styleId]
 * @property {string|null} [locationId]
 * @property {string[]|null} [skus]
 * @property {((error:{canRetry:boolean, retry:()=>void, message:string, reason:string, id:string, data:Object})=>void)|null} [onError]
 * @property {((error:{canRetry:boolean, retry:()=>void, message:string, reason:string, id:string, data:Object})=>import('react').ReactNode)|null} [errorWidget]
 * @property {(()=>import('react').ReactNode)|null} [loadingWidget]
 * @property {number|null} [minFov]
 * @property {number|null} [maxFov]
 * @property {((aspectRatio:number)=>number)|null} [calculateFov] The function to override how the field of view is calculated from the aspect ratio, for example:  (aspectRatio) => 109.22 - (16.69 * aspectRatio)
 * @property {((newFov:number)=>void)|null} [onFovChanged]
 * @property {{yaw:number, pitch:number}|null} [initialCameraRotation]
 * @property {((newRotation:{yaw:number, pitch:number})=>void)|null} [onCameraRotationChanged]
 * @property {number|null} [lookSpeed]
 * @property {number|null} [lookSpeedX]
 * @property {number|null} [lookSpeedY]
 * @property {number|null} [zoomSpeed]
 * @property {string|null} [basisTranscoderPath]
 */
/**
 * The PanoramaViewer component is the main component for rendering a panoramic home.
 *
 * @component
 * @type {import('react').FunctionComponent<PanoramaViewerProps>}
 */
export const PanoramaViewer = LeRed.memo((props) =>
{
	const {homeId:givenHomeId, homeVersion:givenHomeVersion, host:givenHost, styleId:givenStyleId, locationId:givenLocationId, onError, errorWidget, loadingWidget, minFov:givenMinFov, maxFov:givenMaxFov, calculateFov:givenCalculateFov, basisTranscoderPath:givenBasisTranscoderPath, ...other} = props;
	
	const {homeId, homeVersion, host, locationId, styleId, basisTranscoderPath} = LeRed.useMemo(() => getCorrectedGivenProps({homeId:givenHomeId, homeVersion:givenHomeVersion, host:givenHost, styleId:givenStyleId, locationId:givenLocationId, basisTranscoderPath:givenBasisTranscoderPath}), [givenHomeId, givenHomeVersion, givenHost, givenStyleId, givenLocationId, givenBasisTranscoderPath]);
	const {minFov, maxFov} = LeRed.useMemo(() => getCorrectedGivenProps({minFov:givenMinFov, maxFov:givenMaxFov}), [givenMinFov, givenMaxFov]);
	const calculateFov = LeRed.useMemo(() => givenCalculateFov ?? (aspectRatio => 138.06 - (124.11 * aspectRatio) + (103.83 * Math.pow(aspectRatio, 2)) - (29.30 * Math.pow(aspectRatio, 3))), [givenCalculateFov]);
	
	const [attemptId, setAttemptId] = LeRed.useState(LeUtils.uniqueId());
	
	
	const getErrorWidget = LeRed.useCallback((error) =>
	{
		error = LeUtils.clone(error);
		if(error?.canRetry)
		{
			error.retry = () =>
			{
				setAttemptId(null);
				LeUtils.setAnimationFrameTimeout(() => setAttemptId(LeUtils.uniqueId()));
			};
		}
		
		console.error('[PanoramaViewer] Error: ', error);
		onError?.(LeUtils.clone(error));
		return errorWidget?.(LeUtils.clone(error)) ?? (<PanoramaDefaultErrorWidget {...error}/>);
	}, [onError, errorWidget, setAttemptId]);
	
	
	const getLoadingWidget = LeRed.useCallback(() =>
	{
		return loadingWidget?.() ?? (<PanoramaDefaultLoadingWidget/>);
	}, [loadingWidget]);
	
	
	if(!isHostPrivate(host))
	{
		if(!givenHomeId)
		{
			return getErrorWidget({canRetry:false, id:'missing-home-id', message:'Missing home ID', reason:'the PanoramaViewer component was rendered without being given a valid home ID', data:{homeId:givenHomeId}});
		}
		if(homeId !== givenHomeId)
		{
			return getErrorWidget({canRetry:false, id:'invalid-home-id', message:'Invalid home ID: ' + givenHomeId, reason:'the home ID contains invalid characters, only "a-z 0-9 _" is allowed', data:{homeId:givenHomeId}});
		}
		if(!homeId)
		{
			return getErrorWidget({canRetry:false, id:'missing-home-id', message:'Missing home ID', reason:'the PanoramaViewer component was rendered without being given a valid home ID', data:{homeId:givenHomeId}});
		}
	}
	
	if(locationId && (locationId !== givenLocationId))
	{
		return getErrorWidget({canRetry:false, id:'invalid-location-id', message:'Invalid location ID: ' + givenLocationId, reason:'the location ID contains invalid characters, only "a-z 0-9 _" is allowed', data:{locationId:givenLocationId}});
	}
	if(styleId && (styleId !== givenStyleId))
	{
		return getErrorWidget({canRetry:false, id:'invalid-style-id', message:'Invalid style ID: ' + givenStyleId, reason:'the style ID contains invalid characters, only "a-z 0-9 _" is allowed', data:{styleId:givenStyleId}});
	}
	
	if(!attemptId)
	{
		return getLoadingWidget();
	}
	
	return (<>
		<PanoramaLoaderVariationsRetriever homeId={homeId} homeVersion={homeVersion} host={host} styleId={styleId} locationId={locationId} basisTranscoderPath={basisTranscoderPath} minFov={minFov} maxFov={maxFov} calculateFov={calculateFov} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} {...other}/>
	</>);
});
