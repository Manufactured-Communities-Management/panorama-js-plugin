import {LeRed} from '@lowentry/react-redux';
import {LeUtils, INT_LAX, STRING, STRING_ANY} from '@lowentry/utils';


export const PanoramaViewer = LeRed.memo(({sceneId:givenSceneId, skus = null, locationId:givenLocationId = null, sceneHost:givenSceneHost = null, onError = null, errorWidget = null, loadingWidget = null, ...props}) =>
{
	const sceneId = LeRed.useMemo(() => STRING(sceneId).replace(/[^0-9]+/g, ''), givenSceneId);
	const sceneHost = STRING_ANY(sceneHost, 'https://d1i78mubvvqzk6.cloudfront.net');
	const sceneUrl = sceneHost + '/' + sceneId + '/';
	
	const locationId = Math.max(0, INT_LAX(givenLocationId));
	
	
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
		<PanoramaViewerRetriever sceneId={sceneId} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} {...props}/>
	</>);
});


//


const PanoramaViewerRetriever = LeRed.memo(({...props}) =>
{
	const {sceneId, sceneHost, sceneUrl, getErrorWidget, getLoadingWidget} = props;
	
	const [variations, variationsLoading, variationsError] = LeRed.useExternalJson(sceneUrl + 'variations.json');
	
	
	if(!variationsLoading && !variations)
	{
		return getErrorWidget({canRetry:true, id:'could-not-connect-to-scene', message:'Couldn\'t connect to scene: ' + props.sceneId, reason:STRING(variationsError), data:{sceneId, sceneHost, sceneUrl}});
	}
	if(variationsLoading)
	{
		return getLoadingWidget();
	}
	return (<>
		<PanoramaViewerParser variations={variations} {...props}/>
	</>);
});


//


const PanoramaViewerParser = ({...props}) =>
{
	const {variations, skus, locationId, sceneUrl, getErrorWidget, getLoadingWidget} = props;
	
	const location = LeUtils.find(variations.locations, location => location.id === locationId);
	
	
	
	
	const currentImages = LeRed.useSelector(stateVariations.selectors.currentImages);
	const selectedVariationSkus = LeRed.useSelector(stateVariations.selectors.selectedVariationSkus);
	
	
	return (<>
		<PanoramaViewer src={LeUtils.map(currentImages, item => ({...item, basePath:(item.basePath ? sceneUrl + item.basePath : undefined), maskBasePath:(item.maskBasePath ? sceneUrl + item.maskBasePath : undefined)}))}/>
	</>);
};
