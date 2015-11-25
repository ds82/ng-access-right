/**
 * @ngdoc directive
 * @name io.dennis.ng-access-right
 * @restrict A
 *
 * $description
 * @param {string|array=} access-right  String or list of required access rights to show/enable
 *                                      the element
 * @param {string=}       access-action 'hide' or 'disable' element
 */

angular.module('io.dennis.ng-access-right', [])
  .provider('$accessRight', AccessRightProvider)
  .directive('accessRight', AccessRight);

var isDef = angular.isDefined;

const EVENT = 'event';
const ACCESS_CHECK = 'access_check_fn';

var map = new Map();

function AccessRightProvider() {
  this.$get = $get;
  this.setEvent = setEvent;
  this.setCheckFn = setCheckFn;

  function setEvent(eventName) {
    return map.set(EVENT, eventName);
  }

  function setCheckFn(fn) {
    return map.set(ACCESS_CHECK, fn);
  }

  function $get() {
    return this;
  }
}


var fnMap = {};
fnMap.hide = hide;
fnMap.disable = disable;
fnMap.none = function() {};

function AccessRight() {
  return {
    restrict: 'A',
    scope: false,
    link: link
  };

  function link(scope, element, attrs) {
    var [eventName, checkFn] = getConfig();

    var fn = attrs.accessAction && fnMap[attrs.accessAction] || fnMap.disable;
    attrs.originalHref = attrs.href;

    //
    // override function when auth-ok and auth-forbidden are set
    //
    if (isDef(attrs.accessOkClass) && isDef(attrs.accessForbiddenClass)) {
      fn = createToggleCss(attrs.accessOkClass, attrs.accessForbiddenClass);
    }

    evaluateShow();
    scope.$on(eventName, evaluateShow);

    function evaluateShow() {
      var required = scope.$eval(attrs.accessRight) || attrs.accessRight;
      var enabled = checkFn(required);
      fn(element, enabled);
      removeLink(element, attrs, enabled);
    }
  }

  function getConfig() {
    if (!map.has(EVENT) || !map.has(ACCESS_CHECK)) {
      throw new Error(`
        You have to configure the accessRight directive using
        the $accessRight provider before using it.
        Use $accessRight.setEvent() and $accessRight.setCheckFn()
      `)
    }
    return [map.get(EVENT), map.get(ACCESS_CHECK)];
  }

}

function createToggleCss(ok, forbidden) {
  return function(element, enabled) {
    element
      .toggleClass(ok, enabled)
      .toggleClass(forbidden, !enabled);
  };
}

function removeLink(element, attrs, enabled) {
  var remove = attrs.authRemoveLink === 'true' && !enabled;

  if (remove) {
    element.removeAttr('href');
  } else if (attrs.originalHref) {
    element.attr('href', attrs.originalHref);
  }
}

function hide(element, enabled) {
  element
    .toggleClass('ng-hide', !enabled);
}

function disable(element, enabled) {
  element.toggleClass('disabled', !enabled);

  if (!enabled) {
    element.attr('disabled', 'disabled');
  } else {
    element.removeAttr('disabled');
  }
}
