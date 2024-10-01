import {LeUtils, FLOAT_LAX_ANY, STRING, STRING_ANY} from '@lowentry/utils';


/**
 * Returns the given props with corrected values.
 *
 * @param {Object} props
 * @returns {Object}
 */
export const getCorrectedGivenProps = (props) =>
{
	const result = {};
	LeUtils.each(props, (value, key) =>
	{
		let newValue = value;
		switch(key)
		{
			case 'sceneId':
				newValue = STRING(value).replace(/[^a-zA-Z0-9_]+/g, '');
				break;
			case 'sceneVersion':
				newValue = STRING(value || 'latest').trim().toLowerCase();
				break;
			case 'sceneHost':
				newValue = STRING(value || 'https://d1i78mubvvqzk6.cloudfront.net').trim();
				break;
			case 'minFov':
				newValue = Math.max(1, FLOAT_LAX_ANY(value, 20));
				break;
			case 'maxFov':
				newValue = Math.min(179, FLOAT_LAX_ANY(value, 130));
				break;
			case 'initialFov':
				const minFov = Math.max(1, FLOAT_LAX_ANY(result.minFov, 20));
				const maxFov = Math.min(179, FLOAT_LAX_ANY(result.maxFov, 130));
				newValue = Math.max(minFov, Math.min(maxFov, FLOAT_LAX_ANY(value, 95)));
				break;
			case 'basisTranscoderPath':
				newValue = STRING_ANY(value, 'https://d11xh1fqz0z9k8.cloudfront.net/basis_transcoder/');
				break;
		}
		result[key] = newValue;
	});
	return result;
};


/**
 * Returns true if the given scene host is a private URL (like localhost, 127.0.0.1, etc).
 *
 * @param {string} sceneHost
 * @returns {boolean}
 */
export const isSceneHostPrivate = (() =>
{
	const cache = {};
	return (sceneHost) =>
	{
		if(!(sceneHost in cache))
		{
			let sceneHostLower = sceneHost.toLowerCase().trim();
			sceneHostLower = sceneHostLower.replace(/^[a-z]+:\/\//, '');
			sceneHostLower = sceneHostLower.replace(/[:/].*$/, '');
			cache[sceneHost] = LeUtils.isGivenHostPrivate(sceneHostLower);
		}
		return cache[sceneHost];
	};
})();
