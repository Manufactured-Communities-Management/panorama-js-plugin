import {LeRed} from '@lowentry/react-redux';
import {STRING, STRING_ANY, FLOAT_LAX_ANY} from '@lowentry/utils';
import {PanoramaLoaderVariationsRetriever} from './loading/PanoramaLoaderVariationsRetriever';


export const PanoramaViewer = LeRed.memo(({sceneId:givenSceneId, skus = null, locationId:givenLocationId = null, sceneHost:givenSceneHost = null, onError = null, errorWidget = null, loadingWidget = null, minFov:givenMinFov, maxFov:givenMaxFov, initialFov:givenInitialFov, ...other}) =>
{
	const sceneId = LeRed.useMemo(() => STRING(sceneId).replace(/[^0-9]+/g, ''), givenSceneId);
	const sceneHost = STRING_ANY(sceneHost, 'https://d1i78mubvvqzk6.cloudfront.net');
	const sceneUrl = sceneHost + '/' + sceneId + '/';
	
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
	
	
	if(!sceneId)
	{
		return getErrorWidget({canRetry:false, id:'missing-scene-id', message:'Missing scene ID', reason:'the PanoramaViewer component was rendered without being given a valid sceneId', data:{}});
	}
	
	return (<>
		<PanoramaLoaderVariationsRetriever sceneId={sceneId} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} minFov={minFov} maxFov={maxFov} initialFov={initialFov} {...other}/>
	</>);
});
