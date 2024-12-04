import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET, STRING, IS_ARRAY, IS_OBJECT, INT_LAX} from '@lowentry/utils';
import {getVariationJsonData} from './utils/PanoramaVariationObtainingUtils.jsx';
import {getCorrectedGivenProps} from './utils/PanoramaPropsParsingUtils.jsx';


/**
 * Returns the version string of the home (unix timestamp, in millis).
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @returns {Promise<string>}
 */
export const getHomeVersion = async (params) =>
{
	const {homeId, homeVersion, host} = params;
	const {version} = await getVariationJsonData({homeId, homeVersion, host});
	return STRING(version);
};

/**
 * Returns the version string of the home (unix timestamp, in millis).
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @returns {[string|null, boolean, string|null]}
 */
export const useHomeVersion = (params) =>
{
	const {homeId, homeVersion, host} = params;
	return LeRed.usePromises(() => getHomeVersion({homeId, homeVersion, host}), [homeId, homeVersion, host]);
};


/**
 * Returns the version date of the home. Will return new Date(0) if the version timestamp is invalid.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @returns {Promise<Date>}
 */
export const getHomeVersionDate = async (params) =>
{
	const {homeId, homeVersion, host} = params;
	const versionInt = INT_LAX(await getHomeVersion({homeId, homeVersion, host}));
	if(versionInt <= 0)
	{
		return new Date(0);
	}
	const versionDate = new Date(versionInt);
	if(versionDate.toJSON() === null)
	{
		return new Date(0);
	}
	return versionDate;
};

/**
 * Returns the version date of the home. Will return new Date(0) if the version timestamp is invalid.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @returns {[Date|null, boolean, string|null]}
 */
export const useHomeVersionDate = (params) =>
{
	const {homeId, homeVersion, host} = params;
	return LeRed.usePromises(() => getHomeVersionDate({homeId, homeVersion, host}), [homeId, homeVersion, host]);
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
 * @returns {Promise<Object.<string|symbol,string[]>>}
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
				LeUtils.each(location?.supportedStyleIds, styleId =>
				{
					if(styleId)
					{
						onlyVariationStyleIds[styleId] = true;
					}
				});
				LeUtils.each(location?.variationGroups, variationGroup =>
				{
					if(variationGroup?.groupId)
					{
						onlyVariationGroupIds[variationGroup?.groupId] = true;
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
				if(variationGroup?.groupId && ((onlyVariationGroupIds === null) || (variationGroup?.groupId in onlyVariationGroupIds)))
				{
					const variationSkus = result[variationGroup?.groupId] ?? [];
					LeUtils.each(variationGroup?.variations, variation =>
					{
						if(variation?.sku && !variationSkus.includes(variation?.sku))
						{
							variationSkus.push(variation?.sku);
						}
					});
					result[variationGroup?.groupId] = variationSkus;
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
 * @returns {[Object.<string|symbol,string[]>|null, boolean, string|null]}
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
	const location = LeUtils.find(variationData?.locations, location => (location?.locationId === locationId));
	return LeUtils.filter(LeUtils.mapToArray(variationData?.styles, style => (!location || LeUtils.contains(location?.supportedStyleIds, style?.styleId)) ? STRING(style?.styleId) : null));
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
	return LeUtils.filter(LeUtils.mapToArray(variationData?.locations, location => (!styleId || LeUtils.contains(location?.supportedStyleIds, styleId)) ? STRING(location?.locationId) : null));
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


/**
 * Returns the default selected SKUs for the given home.
 * Returns an object with variation group IDs as keys, and the default SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {Promise<Object.<string|symbol,string>>}
 */
export const getDefaultSkusGrouped = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId} = params;
	const {data:variationData} = await getVariationJsonData({homeId, homeVersion, host});
	const {styleId, locationId} = await getCurrentStyleAndLocationId({homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId});
	const result = await getAvailableSkusGrouped({homeId, homeVersion, host, styleId, locationId});
	return LeUtils.map(result, (skus, groupId) =>
	{
		const style = LeUtils.find(variationData?.styles, style => (style?.styleId === styleId));
		const variationGroup = LeUtils.find(style?.variationGroups, variationGroup => (variationGroup?.groupId === groupId));
		const defaultVariationIndex = INT_LAX(variationGroup?.defaultVariationIndex);
		return skus[defaultVariationIndex];
	});
};

/**
 * Returns the default selected SKUs for the given home.
 * Returns an object with variation group IDs as keys, and the default SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {[Object.<string|symbol,string>|null, boolean, string|null]}
 */
export const useDefaultSkusGrouped = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	return LeRed.usePromises(() => getDefaultSkusGrouped({homeId, homeVersion, host, styleId, locationId}), [homeId, homeVersion, host, styleId, locationId]);
};


/**
 * Returns the default selected SKUs for the given home.
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
export const getDefaultSkus = async (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	const skusGrouped = await getDefaultSkusGrouped({homeId, homeVersion, host, styleId, locationId});
	const result = [];
	LeUtils.each(skusGrouped, skus =>
	{
		result.push(...skus);
	});
	return result;
};

/**
 * Returns the default selected SKUs for the given home.
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
export const useDefaultSkus = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	return LeRed.usePromises(() => getDefaultSkus({homeId, homeVersion, host, styleId, locationId}), [homeId, homeVersion, host, styleId, locationId]);
};


/**
 * Returns the default selected style ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.locationId]
 * @returns {Promise<string>}
 */
export const getDefaultStyleId = async (params) =>
{
	const {homeId, homeVersion, host, locationId:givenLocationId} = params;
	const {styleId, locationId} = await getCurrentStyleAndLocationId({homeId, homeVersion, host, locationId:givenLocationId});
	return styleId;
};

/**
 * Returns the default selected style ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.locationId]
 * @returns {[string|null, boolean, string|null]}
 */
export const useDefaultStyleId = (params) =>
{
	const {homeId, homeVersion, host, locationId} = params;
	return LeRed.usePromises(() => getDefaultStyleId({homeId, homeVersion, host, locationId}), [homeId, homeVersion, host, locationId]);
};


/**
 * Returns the default selected location ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @returns {Promise<string>}
 */
export const getDefaultLocationId = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId} = params;
	const {styleId, locationId} = await getCurrentStyleAndLocationId({homeId, homeVersion, host, styleId:givenStyleId});
	return locationId;
};

/**
 * Returns the default selected location ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @returns {[string|null, boolean, string|null]}
 */
export const useDefaultLocationId = (params) =>
{
	const {homeId, homeVersion, host, styleId} = params;
	return LeRed.usePromises(() => getDefaultLocationId({homeId, homeVersion, host, styleId}), [homeId, homeVersion, host, styleId]);
};


/**
 * Returns the currently selected SKUs for the given home.
 * Returns an object with variation group IDs as keys, and the current SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @param {Object.<string|symbol,string>|null} [params.skus]
 * @param {boolean|null} [params.warnings]
 * @returns {Promise<Object.<string|symbol,string>>}
 */
export const getCurrentSkusGrouped = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId, skus, warnings} = params;
	const {data:variationData} = await getVariationJsonData({homeId, homeVersion, host});
	const {styleId, locationId} = await getCurrentStyleAndLocationId({homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId});
	const skuGroups = await getAvailableSkusGrouped({homeId, homeVersion, host, styleId, locationId});
	const selectedSkuGroupIndex = LeUtils.mapToArray(skuGroups, (skus, groupId) =>
	{
		const style = LeUtils.find(variationData?.styles, style => (style?.styleId === styleId));
		const variationGroup = LeUtils.find(style?.variationGroups, variationGroup => (variationGroup?.groupId === groupId));
		return INT_LAX(variationGroup?.defaultVariationIndex);
	});
	if(IS_ARRAY(skus))
	{
		LeUtils.each(skus, sku =>
		{
			let skuFound = false;
			LeUtils.each(skuGroups, (skuGroup, groupId) =>
			{
				let skuGroupIndex = LeUtils.findIndex(skuGroup, skuGroupSku => (skuGroupSku === sku));
				if(ISSET(skuGroupIndex))
				{
					selectedSkuGroupIndex[groupId] = skuGroupIndex;
					skuFound = true;
				}
			});
			if(!skuFound && warnings)
			{
				console.warn('SKU not found:', sku);
			}
		});
	}
	else if(IS_OBJECT(skus))
	{
		LeUtils.each(skus, (sku, groupId) =>
		{
			const skuGroup = skuGroups[groupId];
			if(ISSET(skuGroup))
			{
				const skuGroupIndex = LeUtils.findIndex(skuGroup, skuGroupSku => (skuGroupSku === sku));
				if(ISSET(skuGroupIndex))
				{
					selectedSkuGroupIndex[groupId] = skuGroupIndex;
				}
				else if(warnings)
				{
					console.warn('SKU not found in group:', sku, skuGroup);
				}
			}
			else if(warnings)
			{
				console.warn('SKU Group ID not found:', groupId);
			}
		});
	}
	return LeUtils.map(skuGroups, (skus, groupId) => skus[selectedSkuGroupIndex[groupId]]);
};

/**
 * Returns the currently selected SKUs for the given home.
 * Returns an object with variation group IDs as keys, and the current SKUs as values.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @param {Object.<string|symbol,string>|null} [params.skus]
 * @param {boolean|null} [params.warnings]
 * @returns {[Object.<string|symbol,string>|null, boolean, string|null]}
 */
export const useCurrentSkusGrouped = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId, skus, warnings} = params;
	return LeRed.usePromises(() => getCurrentSkusGrouped({homeId, homeVersion, host, styleId, locationId, skus, warnings}), [homeId, homeVersion, host, styleId, locationId, skus, warnings]);
};


/**
 * Returns the currently selected SKUs for the given home.
 * Returns an array of SKUs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @param {Object.<string|symbol,string>|null} [params.skus]
 * @param {boolean|null} [params.warnings]
 * @returns {Promise<string[]>}
 */
export const getCurrentSkus = async (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId, skus, warnings} = params;
	const skuGroups = await getCurrentSkusGrouped({homeId, homeVersion, host, styleId, locationId, skus, warnings});
	const result = [];
	LeUtils.each(skuGroups, skus =>
	{
		result.push(...skus);
	});
	return result;
};

/**
 * Returns the currently selected SKUs for the given home.
 * Returns an array of SKUs.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @param {Object.<string|symbol,string>|null} [params.skus]
 * @param {boolean|null} [params.warnings]
 * @returns {[string[]|null, boolean, string|null]}
 */
export const useCurrentSkus = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId, skus, warnings} = params;
	return LeRed.usePromises(() => getCurrentSkus({homeId, homeVersion, host, styleId, locationId, skus, warnings}), [homeId, homeVersion, host, styleId, locationId, skus, warnings]);
};


/**
 * Returns the currently selected style and location IDs for the given home.
 *
 * @internal
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {Promise<{styleId:string, locationId:string}>}
 */
const getCurrentStyleAndLocationId = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId} = params;
	const {data:variationData} = await getVariationJsonData({homeId, homeVersion, host});
	
	const getStyleId = ({locationId = undefined}) =>
	{
		const location = !locationId ? null : LeUtils.find(variationData?.locations, location => (location?.locationId === locationId));
		let result = null;
		LeUtils.each(variationData?.styles, style =>
		{
			if(!location || LeUtils.contains(location?.supportedStyleIds, style?.styleId))
			{
				result = style?.styleId;
				return false;
			}
		});
		return STRING(result);
	};
	
	const getLocationId = ({styleId = undefined}) =>
	{
		const style = !styleId ? null : LeUtils.find(variationData?.styles, style => (style?.styleId === styleId));
		let result = null;
		LeUtils.each(variationData?.locations, location =>
		{
			if(!style || LeUtils.contains(location?.supportedStyleIds, styleId))
			{
				result = location?.locationId;
				return false;
			}
		});
		return STRING(result);
	};
	
	let {styleId, locationId} = getCorrectedGivenProps({styleId:givenStyleId, locationId:givenLocationId});
	if(!styleId || !locationId)
	{
		if(!styleId && !locationId)
		{
			styleId = getStyleId({});
		}
		if(styleId)
		{
			locationId = getLocationId({styleId});
		}
		else
		{
			styleId = getStyleId({locationId});
		}
	}
	return {styleId, locationId};
};


/**
 * Returns the currently selected style ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {Promise<string>}
 */
export const getCurrentStyleId = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId} = params;
	const {styleId, locationId} = await getCurrentStyleAndLocationId({homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId});
	return styleId;
};

/**
 * Returns the currently selected style ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {[string|null, boolean, string|null]}
 */
export const useCurrentStyleId = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	return LeRed.usePromises(() => getCurrentStyleId({homeId, homeVersion, host, styleId, locationId}), [homeId, homeVersion, host, styleId, locationId]);
};


/**
 * Returns the currently selected location ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {Promise<string>}
 */
export const getCurrentLocationId = async (params) =>
{
	const {homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId} = params;
	const {styleId, locationId} = await getCurrentStyleAndLocationId({homeId, homeVersion, host, styleId:givenStyleId, locationId:givenLocationId});
	return locationId;
};

/**
 * Returns the currently selected location ID for the given home.
 *
 * @param {Object} params
 * @param {string} params.homeId
 * @param {string|null} [params.homeVersion]
 * @param {string|null} [params.host]
 * @param {string|null} [params.styleId]
 * @param {string|null} [params.locationId]
 * @returns {[string|null, boolean, string|null]}
 */
export const useCurrentLocationId = (params) =>
{
	const {homeId, homeVersion, host, styleId, locationId} = params;
	return LeRed.usePromises(() => getCurrentLocationId({homeId, homeVersion, host, styleId, locationId}), [homeId, homeVersion, host, styleId, locationId]);
};
