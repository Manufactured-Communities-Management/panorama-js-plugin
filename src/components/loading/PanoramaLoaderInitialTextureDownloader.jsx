import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET, STRING} from '@lowentry/utils';
import {PanoramaRenderer} from '../rendering/PanoramaRenderer.jsx';


export const PanoramaLoaderInitialTextureDownloader = ({src, ...props}) =>
{
	const {sceneId, sceneHost, sceneUrl, getErrorWidget, getLoadingWidget} = props;
	
	const srcBaseImagePaths = LeRed.useMemo(() => LeUtils.flattenArray(LeUtils.map(src, item => !ISSET(item.maskBasePath) ? [item.basePath + '/0.ktx2'] : [item.basePath + '/0.ktx2', item.maskBasePath + '/0.ktx2'])), [src]);
	const [/* download data is ignored, as it's just to cache it in the browser */, srcBaseImagesLoading, srcBaseImagesError] = LeRed.useExternalBlob(srcBaseImagePaths);
	
	const [srcToRender, setSrcToRender] = LeRed.useState([]);
	
	
	LeRed.useEffect(() =>
	{
		if(src.length && !srcBaseImagesLoading)
		{
			setSrcToRender(src);
		}
	}, [src, srcBaseImagesLoading]);
	
	
	if(srcBaseImagesError)
	{
		return getErrorWidget({canRetry:true, id:'could-not-load-scene', message:'Couldn\'t load the scene: ' + sceneId, reason:STRING(srcBaseImagesError), data:{sceneId, sceneHost, sceneUrl}});
	}
	if(srcBaseImagesLoading && (srcToRender.length === 0))
	{
		return getLoadingWidget();
	}
	
	return (<>
		<PanoramaRenderer src={srcToRender} {...props}/>
	</>);
};
