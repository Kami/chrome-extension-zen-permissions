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

$(document).ready(function(){
  $('.collapse').on('show.bs.collapse', function(e) {
    var extensionId, target, $elem;

    target = e.target;

    if (['high-risk', 'medium-risk', 'low-risk'].indexOf(target.id) !== -1) {
      $elem = $('div[data-target="#' + target.id + '"]').children('span');
      $elem.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    }
    else {
      extensionId = e.target.id.split('-')[1];

      $elem = $('button[data-target="#details-' + extensionId + '"]');
      $elem.html('&#9650;');
    }
  });

  $('.collapse').on('hide.bs.collapse', function(e) {
    var extensionId, target, $elem;

    target = e.target;

    if (['high-risk', 'medium-risk', 'low-risk'].indexOf(target.id) !== -1) {
      $elem = $('div[data-target="#' + target.id + '"]').children('span');
      $elem.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    }
    else {
      extensionId = e.target.id.split('-')[1];

      $elem = $('button[data-target="#details-' + extensionId + '"]');
      $elem.html('&#9660;');
    }
  });
});
