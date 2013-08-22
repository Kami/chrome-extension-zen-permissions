/*
 *  Copyright 2013 Tomaz Muraus
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

/* global async, Handlebars */

// https://support.google.com/chrome_webstore/answer/186213?hl=en
// http://developer.chrome.com/extensions/declare_permissions.html
var RISK_CATEGORY_TO_PERMISSIONS_MAP = {
  'high': [
    'plugin',
    'privacy'
  ],
  'medium': [
    'cookies',
    'geolocation',
    'unlimitedStorage'
  ],
  'low': [
    'management',
    'bookmarks',
    'history',
    'tabs',
    'notifications',
    'clipboardRead',
    'clipboardWrite',
    'storage'
  ]
};

// http://developer.chrome.com/extensions/match_patterns.html
var RISK_CATEGORY_TO_HOST_PERMISSIONS_MAP = {
  'high': [
    'http://*/*',
    'https://*/*',
    '*://*/*',
    '<all_urls>'
  ]
};

var RISK_SEVERITY_MAP = {
  'high': 3,
  'medium': 2,
  'low': 1
};

var DISABLED_REASON_MAP = {
  'unknown': 'Unknown',
  'permissions_increase': 'Disabled due to increased permission requirements'
};

var DEFAULT_DESIRED_ICON_SIZE = 24;
var EXTENSION_OVERVIEW_TMPL = Handlebars.templates['extension_overview'];
var EXTENSION_DETAILS_TMPL = Handlebars.templates['extension_details'];

function getRiskCategory(permissions, hostPermissions) {
  var i, categoryPermissions, permission, category;

  category = 'low';

  categoryPermissions = RISK_CATEGORY_TO_PERMISSIONS_MAP.high;

  for (i = 0; i < categoryPermissions.length; i++) {
    permission = categoryPermissions[i];

    if (permissions.indexOf(permission) !== -1) {
      category = 'high';
    }
  }

  categoryPermissions = RISK_CATEGORY_TO_HOST_PERMISSIONS_MAP.high;

  for (i = 0; i < categoryPermissions.length; i++) {
    permission = categoryPermissions[i];

    if (hostPermissions.indexOf(permission) !== -1) {
      category = 'high';
    }
  }

  if (category === 'high') {
    // No need to check further
    return category;
  }

  categoryPermissions = RISK_CATEGORY_TO_PERMISSIONS_MAP.medium;

  for (i = 0; i < categoryPermissions.length; i++) {
    permission = categoryPermissions[i];

    if (permissions.indexOf(permission) !== -1) {
      category = 'medium';
    }
  }

  return category;
}

function getContextForExtension(extension, desiredIconSize) {
  var icons, i, item, icon, context, permissions, hostPermissions, permissionWarnings;

  icon = null;
  context = {};

  desiredIconSize = desiredIconSize || DEFAULT_DESIRED_ICON_SIZE;

  icons = extension.icons || [];
  icons.sort(function compare(a, b) {
    if (a.size < b.size) {
      return -1;
    }
    else if (a.size > b.size) {
      return 1;
    }
    else {
      return 0;
    }
  });

  // If deseried size is not available, find the largest one close to
  // the desired size
  for (i = 0; i < icons.length; i++) {
    item = icons[0];

    if (item.size === desiredIconSize) {
      icon = item.url;
      break;
    }
    else if (item.size > desiredIconSize) {
      icon = item.url;
      break;
    }
  }

  // If the closest largest icon is not available, use the first one
  if (!icon) {
    if (icons.length >= 1) {
      icon = icons[0].url;
    }
    else {
      icon = 'assets/img/questionmark.png';
    }
  }

  hostPermissions = extension.hostPermissions || [];
  permissionWarnings = extension.permissionWarnings || [];

  context.id = extension.id;
  context.name = extension.name;
  context.description = extension.description;
  context.website = extension.homepageUrl;
  context.disabled = !extension.enabled;
  context.disabledReason = null;
  context.icon = icon;

  context.hostPermissions = hostPermissions;
  context.permissions = extension.permissions;
  context.permissionWarnings = extension.permissionWarnings;
  context.riskCategory = getRiskCategory(extension.permissions,
                                         extension.hostPermissions);

  if (context.disabled && extension.disabledReason) {
    context.disabledReason = DISABLED_REASON_MAP[extension.disabledReason];
  }

  if (permissionWarnings.length >= 1) {
    context.summary = permissionWarnings[0];
  }
  else {
    context.summary = '';
  }

  return context;
}

function compareEnabledFirst(a, b) {
  if ((a.enabled && b.enabled) || (!a.enabled && !b.enabled)) {
    return 0;
  }

  if (a.enabled && !b.enabled) {
    return -1;
  }

  if (!a.enabled && b.enabled) {
    return 1;
  }
}

async.waterfall([
  function displayLoadingImage(callback) {
    var categories = Object.keys(RISK_SEVERITY_MAP), category;

    categories.forEach(function(category) {
      $('#' + category + '-risk-notice').html('<img src="assets/img/loading.gif">');
    });

    callback();
  },

  function getAllPlugins(callback) {
    chrome.management.getAll(function(result) {
      callback(null, result);
    });
  },

  function filterExtension(result, callback) {
    var extensions = result.filter(function(item) {
      return (item.type === 'extension');
    });

    callback(null, extensions);
  },

  function assignPermissionWarnings(extensions, callback) {
    async.forEach(extensions, function(extension, callback) {
      chrome.management.getPermissionWarningsById(extension.id, function(warnings) {
        extension.permissionWarnings = warnings;
        callback();
      });
    }, function(err) {
      callback(err, extensions);
    });
  },

  function sortAndAssignContext(extensions, callback) {
    var result, categories, category;

    result = {
      'high': [],
      'medium': [],
      'low': []
    };

    categories = Object.keys(result);

    for (category in result) {
      $('#' + category + '-risk-notice').html('<img src="assets/img/loading.gif">');
    }

    extensions.forEach(function(extension) {
      var htmlOverview, htmlDetails, context;

      context = getContextForExtension(extension);
      extension.context = context;
      result[context.riskCategory].push(extension);
    });

    for (category in result) {
      result[category].sort(compareEnabledFirst);
      extensions = result[category];

      $('#' + category + '-risk-count').html(extensions.length);

      if (extensions.length >= 1) {
        $('#' + category + '-risk-notice').remove();
      }
      else {
        $('#' + category + '-risk-notice').html('No extensions found');
      }

      extensions.forEach(function(extension) {
        var htmlOverview, htmlDetails;

        htmlOverview = EXTENSION_OVERVIEW_TMPL(extension.context);
        htmlDetails = EXTENSION_DETAILS_TMPL(extension.context);

        $('#' + category + '-risk-table').append(htmlOverview);
        $('tr#overview-' + extension.id).parent().append(htmlDetails);
      });
    }

    callback();
  }
]);
