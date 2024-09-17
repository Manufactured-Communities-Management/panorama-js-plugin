import {LeRed} from '@lowentry/react-redux';
import {STRING} from '@lowentry/utils';
import {PanoramaLoaderVariationsRetriever} from './PanoramaLoaderVariationsRetriever.jsx';


const PanoramaLoaderVersionRetrieverImpl = LeRed.memo(({sceneVersion:givenSceneVersion, sceneVersionJsonFile, ...props}) =>
{
	const {sceneId, sceneHost, getErrorWidget, getLoadingWidget} = props;
	
	const [versionData, versionDataLoading, versionDataError] = LeRed.useExternalJson(sceneHost + '/' + sceneId + '/' + sceneVersionJsonFile);
	
	
	if(!versionDataLoading && !versionData?.version)
	{
		return getErrorWidget({canRetry:true, id:'could-not-connect-to-scene', message:'Couldn\'t connect to scene: ' + sceneId, reason:STRING(versionDataError), data:{sceneId, sceneHost, sceneVersion:givenSceneVersion}});
	}
	if(versionDataLoading)
	{
		return getLoadingWidget();
	}
	
	return (<>
		<PanoramaLoaderVariationsRetriever sceneVersion={STRING(versionData?.version)} sceneUrl={sceneHost + '/' + sceneId + '/' + STRING(versionData?.version) + '/'} {...props}/>
	</>);
});


export const PanoramaLoaderVersionRetriever = LeRed.memo(({sceneVersion:givenSceneVersion, ...props}) =>
{
	const {sceneId, sceneHost} = props;
	
	if(givenSceneVersion && (STRING(givenSceneVersion).toLowerCase() !== 'latest'))
	{
		return (<>
			<PanoramaLoaderVariationsRetriever sceneVersion={STRING(givenSceneVersion)} sceneUrl={sceneHost + '/' + sceneId + '/' + STRING(givenSceneVersion) + '/'} {...props}/>
		</>);
	}
	
	return (<>
		<PanoramaLoaderVersionRetrieverImpl sceneVersion={givenSceneVersion} sceneVersionJsonFile={'latest.json'} {...props}/>
	</>);
});
