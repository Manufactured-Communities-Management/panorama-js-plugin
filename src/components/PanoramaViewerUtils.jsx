import {LeRed} from '@lowentry/react-redux';
import {LeUtils, STRING} from '@lowentry/utils';
import {getVariationJsonData} from './utils/PanoramaVariationObtainingUtils.jsx';
import {getCorrectedGivenProps} from './utils/PanoramaPropsParsingUtils';


/**
 * Returns an object with variation group IDs as keys, and arrays of SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {Promise<Object>}
 */
export const getAvailableSkusGrouped = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId} = params;
	const {styleId, locationId} = getCorrectedGivenProps({styleId:givenStyleId, locationId:givenLocationId});
	const {data:variationData} = await getVariationJsonData({homeId, homeVersion, host});
	
	let onlyVariationStyleIds = null;
	let onlyVariationGroupIds = null;
	if(locationId)
	{
		onlyVariationStyleIds = {};
		onlyVariationGroupIds = {};
		LeUtils.each(variationData?.locations, location =>
		{
			if(location?.locationId === locationId)
			{
				LeUtils.each(location.supportedStyleIds, styleId =>
				{
					if(styleId)
					{
						onlyVariationStyleIds[styleId] = true;
					}
				});
				LeUtils.each(location.variationGroups, variationGroup =>
				{
					if(variationGroup?.groupId)
					{
						onlyVariationGroupIds[variationGroup.groupId] = true;
					}
					LeUtils.each(variationGroup?.layerDependencyGroupIds, layerDependencyGroupId =>
					{
						if(layerDependencyGroupId)
						{
							onlyVariationGroupIds[layerDependencyGroupId] = true;
						}
					});
				});
			}
		});
	}
	
	const result = {};
	LeUtils.each(variationData?.styles, style =>
	{
		if((!styleId || (style?.styleId === styleId)) && ((onlyVariationStyleIds === null) || (style?.styleId in onlyVariationStyleIds)))
		{
			LeUtils.each(style?.variationGroups, variationGroup =>
			{
				if((onlyVariationGroupIds === null) || (variationGroup?.groupId in onlyVariationGroupIds))
				{
					const variationSkus = result[variationGroup.groupId] ?? [];
					LeUtils.each(variationGroup?.variations, variation =>
					{
						if(variation?.sku && !variationSkus.includes(variation?.sku))
						{
							variationSkus.push(variation?.sku);
						}
					});
					result[variationGroup.groupId] = variationSkus;
				}
			});
		}
	});
	return result;
};

/**
 * Returns an object with variation group IDs as keys, and arrays of SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {[Object|null, boolean, string|null]}
 */
export const useAvailableSkusGrouped = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	return LeRed.usePromises(() => getAvailableSkusGrouped({homeId, homeVersion, host, styleId, locationId}), [homeId, homeVersion, host, styleId, locationId]);
};


/**
 * Returns an array of SKUs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {Promise<string[]>}
 */
export const getAvailableSkus = async (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	const skusGrouped = await getAvailableSkusGrouped({homeId, homeVersion, host, styleId, locationId});
	const result = [];
	LeUtils.each(skusGrouped, skus =>
	{
		result.push(...skus);
	});
	return result;
};

/**
 * Returns an array of SKUs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {[string[]|null, boolean, string|null]}
 */
export const useAvailableSkus = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	return LeRed.usePromises(() => getAvailableSkus({homeId, homeVersion, host, styleId, locationId}), [homeId, homeVersion, host, styleId, locationId]);
};


/**
 * Returns an array of style IDs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.locationId]
 * @returns {Promise<string[]>}
 */
export const getAvailableStyleIds = async (params) =>
{
	const {homeId, homeVersion, host, locationId:givenLocationId} = params;
	const {locationId} = getCorrectedGivenProps({locationId:givenLocationId});
	const {data:variationData} = await getVariationJsonData({homeId, homeVersion, host});
	const location = LeUtils.find(variationData?.locations, location => location?.locationId === locationId);
	return LeUtils.filter(LeUtils.mapToArray(variationData?.styles, style => (!location || LeUtils.contains(location?.supportedStyleIds, style?.styleId)) ? STRING(style?.styleId) : null), styleId => !!styleId);
};

/**
 * Returns an array of style IDs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.locationId]
 * @returns {[string[]|null, boolean, string|null]}
 */
export const useAvailableStyleIds = (params) =>
{
	const {homeId, homeVersion, host, locationId} = params;
	return LeRed.usePromises(() => getAvailableStyleIds({homeId, homeVersion, host, locationId}), [homeId, homeVersion, host, locationId]);
};


/**
 * Returns an array of location IDs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @returns {Promise<string[]>}
 */
export const getAvailableLocationIds = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId} = params;
	const {styleId} = getCorrectedGivenProps({styleId:givenStyleId});
	const {data:variationData} = await getVariationJsonData({homeId, homeVersion, host});
	return LeUtils.filter(LeUtils.mapToArray(variationData?.locations, location => (!styleId || LeUtils.contains(location?.supportedStyleIds, styleId)) ? STRING(location?.locationId) : null), locationId => !!locationId);
};

/**
 * Returns an array of location IDs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @returns {[string[]|null, boolean, string|null]}
 */
export const useAvailableLocationIds = (params) =>
{
	const {homeId, homeVersion, host, styleId} = params;
	return LeRed.usePromises(() => getAvailableLocationIds({homeId, homeVersion, host, styleId}), [homeId, homeVersion, host, styleId]);
};
