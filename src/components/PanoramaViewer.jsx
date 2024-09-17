import {LeRed} from '@lowentry/react-redux';
import {STRING, STRING_ANY, FLOAT_LAX_ANY} from '@lowentry/utils';
import {PanoramaLoaderVersionRetriever} from './loading/PanoramaLoaderVersionRetriever.jsx';


export const PanoramaViewer = LeRed.memo(({sceneId:givenSceneId, sceneVersion:givenSceneVersion = 'latest', skus = null, locationId = null, sceneHost:givenSceneHost = null, onError = null, errorWidget = null, loadingWidget = null, minFov:givenMinFov, maxFov:givenMaxFov, initialFov:givenInitialFov, ...other}) =>
{
	const sceneId = LeRed.useMemo(() => STRING(givenSceneId).replace(/[^a-z0-9_]+/g, ''), givenSceneId);
	const sceneVersion = LeRed.useMemo(() => STRING(!givenSceneVersion ? 'latest' : givenSceneVersion).trim().toLowerCase(), givenSceneVersion);
	const sceneHost = STRING_ANY(givenSceneHost, 'https://d1i78mubvvqzk6.cloudfront.net');
	
	const minFov = Math.max(1, FLOAT_LAX_ANY(other.minFov, 10));
	const maxFov = Math.min(179, FLOAT_LAX_ANY(other.maxFov, 130));
	const initialFov = Math.max(minFov, Math.min(maxFov, FLOAT_LAX_ANY(other.initialFov, 95)));
	
	
	const getErrorWidget = LeRed.useCallback((error) =>
	{
		console.error('[PanoramaViewer] Error: ', error);
		onError?.(error);
		return errorWidget?.(error) ?? null;
	}, [onError, errorWidget]);
	
	const getLoadingWidget = LeRed.useCallback(() =>
	{
		return loadingWidget ?? (<div style={{animation:'spin 1s linear infinite', border:'3px solid #3BA5CA', borderRightColor:'#00000000'}}/>);
	}, [loadingWidget]);
	
	
	if(!givenSceneId)
	{
		return getErrorWidget({canRetry:false, id:'missing-scene-id', message:'Missing scene ID', reason:'the PanoramaViewer component was rendered without being given a valid sceneId', data:{sceneId:givenSceneId}});
	}
	if(sceneId !== givenSceneId)
	{
		return getErrorWidget({canRetry:false, id:'invalid-scene-id', message:'Invalid scene ID: ' + givenSceneId, reason:'the scene ID contains invalid characters, only "a-z 0-9 _" is allowed', data:{sceneId:givenSceneId}});
	}
	if(!sceneId)
	{
		return getErrorWidget({canRetry:false, id:'missing-scene-id', message:'Missing scene ID', reason:'the PanoramaViewer component was rendered without being given a valid sceneId', data:{sceneId:givenSceneId}});
	}
	
	return (<>
		<PanoramaLoaderVersionRetriever sceneId={sceneId} sceneVersion={sceneVersion} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} minFov={minFov} maxFov={maxFov} initialFov={initialFov} {...other}/>
	</>);
});
