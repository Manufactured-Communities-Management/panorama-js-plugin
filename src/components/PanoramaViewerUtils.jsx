import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET} from '@lowentry/utils';
import {getVariationJsonData} from './utils/PanoramaVariationObtainingUtils.jsx';


/**
 * Returns an object with variation group IDs as keys, and arrays of SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.sceneId
 * @param {string|null} [params.sceneVersion]
 * @param {string|null} [params.sceneHost]
 * @param {string|null} [params.locationId]
 * @returns {Promise<Object>}
 */
export const getAvailableSkusGrouped = async (params) =>
{
	const {sceneId, sceneVersion, sceneHost, locationId} = params;
	const {data:variationData} = await getVariationJsonData({sceneId, sceneVersion, sceneHost});
	
	let onlyVariationGroupIds = null;
	if(ISSET(locationId))
	{
		onlyVariationGroupIds = {};
		LeUtils.each(variationData?.locations, location =>
		{
			if(location?.locationId === locationId)
			{
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
	LeUtils.each(variationData?.variationGroups, variationGroup =>
	{
		if((onlyVariationGroupIds === null) || (variationGroup?.groupId in onlyVariationGroupIds))
		{
			const variationSkus = [];
			LeUtils.each(variationGroup?.variations, variation =>
			{
				if(variation?.sku)
				{
					variationSkus.push(variation?.sku);
				}
			});
			result[variationGroup.groupId] = variationSkus;
		}
	});
	return result;
};

/**
 * Returns an object with variation group IDs as keys, and arrays of SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.sceneId
 * @param {string|null} [params.sceneVersion]
 * @param {string|null} [params.sceneHost]
 * @param {string|null} [params.locationId]
 * @returns [Object|null, boolean, string|null]
 */
export const useAvailableSkusGrouped = (params) =>
{
	const {sceneId, sceneVersion, sceneHost, locationId} = params;
	return LeRed.usePromises(() => getAvailableSkusGrouped({sceneId, sceneVersion, sceneHost, locationId}), [sceneId, sceneVersion, sceneHost, locationId]);
};


/**
 * Returns an array of SKUs.
 *
 * @param {Object} params
 * @param {string} params.sceneId
 * @param {string|null} [params.sceneVersion]
 * @param {string|null} [params.sceneHost]
 * @param {string|null} [params.locationId]
 * @returns {Promise<string[]>}
 */
export const getAvailableSkus = async (params) =>
{
	const {sceneId, sceneVersion, sceneHost, locationId} = params;
	const skusGrouped = await getAvailableSkusGrouped({sceneId, sceneVersion, sceneHost, locationId});
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
 * @param {string} params.sceneId
 * @param {string|null} [params.sceneVersion]
 * @param {string|null} [params.sceneHost]
 * @param {string|null} [params.locationId]
 * @returns [string[]|null, boolean, string|null]
 */
export const useAvailableSkus = (params) =>
{
	const {sceneId, sceneVersion, sceneHost, locationId} = params;
	return LeRed.usePromises(() => getAvailableSkus({sceneId, sceneVersion, sceneHost, locationId}), [sceneId, sceneVersion, sceneHost, locationId]);
};


/**
 * Returns an array of location IDs.
 *
 * @param {Object} params
 * @param {string} params.sceneId
 * @param {string|null} [params.sceneVersion]
 * @param {string|null} [params.sceneHost]
 * @returns {Promise<string[]>}
 */
export const getAvailableLocationIds = async (params) =>
{
	const {sceneId, sceneVersion, sceneHost} = params;
	const {data:variationData} = await getVariationJsonData({sceneId, sceneVersion, sceneHost});
	return LeUtils.filter(LeUtils.mapToArray(variationData?.locations, location => location.locationId), locationId => !!locationId);
};

/**
 * Returns an array of location IDs.
 *
 * @param {Object} params
 * @param {string} params.sceneId
 * @param {string|null} [params.sceneVersion]
 * @param {string|null} [params.sceneHost]
 * @returns [string[]|null, boolean, string|null]
 */
export const useAvailableLocationIds = (params) =>
{
	const {sceneId, sceneVersion, sceneHost} = params;
	return LeRed.usePromises(() => getAvailableLocationIds({sceneId, sceneVersion, sceneHost}), [sceneId, sceneVersion, sceneHost]);
};
