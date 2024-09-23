import {LeRed} from '@lowentry/react-redux';
import {LeUtils, STRING} from '@lowentry/utils';
import {getCorrectedGivenProps} from './PanoramaPropsParsingUtils.jsx';


/**
 * Fetches a JSON file, and caches the fetch promise (and the result).
 *
 * @param {string} url
 * @returns {Promise<*>}
 */
const fetchJsonCached = (() =>
{
	const cachePromise = {};
	const cacheResult = {};
	return async (url) =>
	{
		url = STRING(url);
		if(!(url in cachePromise))
		{
			cachePromise[url] = (async () =>
			{
				const result = await LeUtils.fetch(url, {retries:3});
				cacheResult[url] = await result?.json?.();
				return cacheResult[url];
			})();
		}
		await cachePromise[url];
		return cacheResult[url];
	};
})();


/**
 * Returns the variation JSON data.
 *
 * If sceneVersion is 'latest' (or null, or undefined), it will first fetch the latest version from the scene.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @returns {Promise<{version:string, url:string, data:{}}>}
 */
export const getVariationJsonData = async ({sceneId:givenSceneId, sceneVersion:givenSceneVersion = 'latest', sceneHost:givenSceneHost = null}) =>
{
	let {sceneId, sceneVersion, sceneHost} = getCorrectedGivenProps({sceneId:givenSceneId, sceneVersion:givenSceneVersion, sceneHost:givenSceneHost});
	
	if(sceneVersion === 'latest')
	{
		const latestData = await fetchJsonCached(sceneHost + '/' + sceneId + '/latest.json');
		if(!latestData || !latestData?.version)
		{
			throw new Error('the latest.json file doesn\'t contain a version number: ' + sceneHost + '/' + sceneId + '/latest.json');
		}
		sceneVersion = latestData.version;
	}
	const sceneUrl = sceneHost + '/' + sceneId + '/' + sceneVersion + '/';
	
	const variationData = await fetchJsonCached(sceneUrl + 'variations.json');
	if(!variationData)
	{
		throw new Error('the variations.json file couldn\'t be loaded: ' + sceneUrl + 'variations.json');
	}
	
	return {version:sceneVersion, url:sceneUrl, data:variationData};
};

/**
 * Returns the variation JSON data.
 *
 * If sceneVersion is 'latest' (or null, or undefined), it will first fetch the latest version from the scene.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @returns [{version:string, url:string, data:{}}|null, boolean, string|null]
 */
export const useVariationJsonData = ({sceneId, sceneVersion = 'latest', sceneHost = null}) =>
{
	return LeRed.usePromises(() => getVariationJsonData({sceneId, sceneVersion, sceneHost}), [sceneId, sceneVersion, sceneHost]);
};
