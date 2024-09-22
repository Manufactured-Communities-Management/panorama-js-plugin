import {getCorrectedGivenProps} from './utils/PanoramaPropsParsingUtils.jsx';
import {LeUtils} from '@lowentry/utils';


const getVariationJsonData = async ({sceneId:givenSceneId, sceneVersion:givenSceneVersion = 'latest', sceneHost:givenSceneHost = null}) =>
{
	let {sceneId, sceneVersion, sceneHost} = getCorrectedGivenProps({sceneId:givenSceneId, sceneVersion:givenSceneVersion, sceneHost:givenSceneHost});
	
	if(sceneVersion === 'latest')
	{
		const latestData = await (await LeUtils.fetch(sceneHost + '/' + sceneId + '/latest.json', {retries:3}))?.json?.();
		if(!latestData || !latestData?.version)
		{
			throw new Error('Couldn\'t connect to scene: ' + sceneId);
		}
		sceneVersion = latestData.version;
	}
	
	const variationData = await (await LeUtils.fetch(sceneHost + '/' + sceneId + '/' + sceneVersion + '/variations.json', {retries:3}))?.json?.();
	if(!variationData)
	{
		throw new Error('Couldn\'t connect to scene: ' + sceneId);
	}
	return variationData;
};


export const getAvailableSkus = async ({sceneId, sceneVersion = 'latest', sceneHost = null}) =>
{
	const variationData = await getVariationJsonData({sceneId, sceneVersion, sceneHost});
	console.log('variationData', variationData);
};
