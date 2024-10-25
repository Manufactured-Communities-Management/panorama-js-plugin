import {LeUtils, FLOAT_LAX_ANY, STRING} from '@lowentry/utils';


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
			case 'homeId':
			case 'locationId':
			case 'styleId':
				newValue = STRING(value).replace(/[^a-zA-Z0-9_]+/g, '');
				break;
			case 'homeVersion':
				newValue = (STRING(value).trim() || 'latest').toLowerCase();
				break;
			case 'host':
				newValue = (STRING(value).trim() || 'https://d1i78mubvvqzk6.cloudfront.net');
				break;
			case 'minFov':
				newValue = Math.max(1, FLOAT_LAX_ANY(value, 20));
				break;
			case 'maxFov':
				newValue = Math.min(179, FLOAT_LAX_ANY(value, 130));
				break;
			case 'basisTranscoderPath':
				newValue = (STRING(value).trim() || 'https://d11xh1fqz0z9k8.cloudfront.net/basis_transcoder/');
				break;
		}
		result[key] = newValue;
	});
	return result;
};


/**
 * Returns true if the given host is a private URL (like localhost, 127.0.0.1, etc).
 *
 * @param {string} host
 * @returns {boolean}
 */
export const isHostPrivate = (() =>
{
	const cache = {};
	return (host) =>
	{
		if(!(host in cache))
		{
			let hostLower = host.toLowerCase().trim();
			hostLower = hostLower.replace(/^[a-z]+:\/\//, '');
			hostLower = hostLower.replace(/[:/].*$/, '');
			cache[host] = LeUtils.isGivenHostPrivate(hostLower);
		}
		return cache[host];
	};
})();
