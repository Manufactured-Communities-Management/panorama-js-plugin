import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET} from '@lowentry/utils';
import {getVariationJsonData} from './utils/PanoramaVariationObtainingUtils.jsx';


/**
 * Returns an object with variation group IDs as keys, and arrays of SKUs as values.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @param {string|null} [props.locationId]
 * @returns {Promise<{}>}
 */
export const getAvailableSkusGrouped = async ({sceneId, sceneVersion = 'latest', sceneHost = null, locationId = null}) =>
{
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
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @param {string|null} [props.locationId]
 * @returns [{}|null, boolean, string|null]
 */
export const useAvailableSkusGrouped = ({sceneId, sceneVersion = 'latest', sceneHost = null, locationId = null}) =>
{
	return LeRed.usePromises(() => getAvailableSkusGrouped({sceneId, sceneVersion, sceneHost, locationId}), [sceneId, sceneVersion, sceneHost, locationId]);
};


/**
 * Returns an array of SKUs.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @param {string|null} [props.locationId]
 * @returns {Promise<string[]>}
 */
export const getAvailableSkus = async ({sceneId, sceneVersion = 'latest', sceneHost = null, locationId = null}) =>
{
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
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @param {string|null} [props.locationId]
 * @returns [string[]|null, boolean, string|null]
 */
export const useAvailableSkus = ({sceneId, sceneVersion = 'latest', sceneHost = null, locationId = null}) =>
{
	return LeRed.usePromises(() => getAvailableSkus({sceneId, sceneVersion, sceneHost, locationId}), [sceneId, sceneVersion, sceneHost, locationId]);
};


/**
 * Returns an array of location IDs.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @returns {Promise<string[]>}
 */
export const getAvailableLocationIds = async ({sceneId, sceneVersion = 'latest', sceneHost = null}) =>
{
	const {data:variationData} = await getVariationJsonData({sceneId, sceneVersion, sceneHost});
	return LeUtils.filter(LeUtils.mapToArray(variationData?.locations, location => location.locationId), locationId => !!locationId);
};

/**
 * Returns an array of location IDs.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @returns [string[]|null, boolean, string|null]
 */
export const useAvailableLocationIds = ({sceneId, sceneVersion = 'latest', sceneHost = null}) =>
{
	return LeRed.usePromises(() => getAvailableLocationIds({sceneId, sceneVersion, sceneHost}), [sceneId, sceneVersion, sceneHost]);
};
