import {LeRed} from '@lowentry/react-redux';
import {LeUtils, STRING} from '@lowentry/utils';
import {getCorrectedGivenProps, isHostPrivate} from './PanoramaPropsParsingUtils.jsx';


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
 * If homeVersion is 'latest' (or null, or undefined), it will first fetch the latest version from the home.
 *
 * @param {Object} props
 * @param {string} props.homeId
 * @param {string|null} [props.homeVersion]
 * @param {string|null} [props.host]
 * @returns {Promise<{version:string, url:string, data:Object}>}
 */
export const getVariationJsonData = async (props) =>
{
	const {homeId:givenHomeId, homeVersion:givenHomeVersion, host:givenHost} = props;
	let {homeId, homeVersion, host} = getCorrectedGivenProps({homeId:givenHomeId, homeVersion:givenHomeVersion, host:givenHost});
	
	let homeUrl;
	if(isHostPrivate(host))
	{
		homeVersion = 'latest';
		homeUrl = host + (host.endsWith('/') ? '' : '/');
	}
	else
	{
		if(homeVersion === 'latest')
		{
			const latestData = await fetchJsonCached(host + '/' + homeId + '/latest.json');
			if(!latestData || !latestData?.version)
			{
				throw new Error('the latest.json file doesn\'t contain a version number: ' + host + '/' + homeId + '/latest.json');
			}
			homeVersion = latestData.version;
		}
		homeUrl = host + '/' + homeId + '/' + homeVersion + '/';
	}
	
	const variationData = await fetchJsonCached(homeUrl + 'variations.json');
	if(!variationData)
	{
		throw new Error('the variations.json file couldn\'t be loaded: ' + homeUrl + 'variations.json');
	}
	
	return {version:homeVersion, url:homeUrl, data:variationData};
};

/**
 * Returns the variation JSON data.
 *
 * If homeVersion is 'latest' (or null, or undefined), it will first fetch the latest version from the home.
 *
 * @param {Object} props
 * @param {string} props.homeId
 * @param {string|null} [props.homeVersion]
 * @param {string|null} [props.host]
 * @returns [{version:string, url:string, data:Object}|null, boolean, string|null]
 */
export const useVariationJsonData = (props) =>
{
	const {homeId, homeVersion, host} = props;
	return LeRed.usePromises(() => getVariationJsonData({homeId, homeVersion, host}), [homeId, homeVersion, host]);
};
