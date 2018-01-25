const hiddenProp = exports.hiddenProp = (object, property, getter, setter) =>  {
  const hidden = {};
  getter = getter || function() { return hidden[property] };
  setter = setter || function(val) { hidden[property] = val };
  return Object.defineProperty(object, property, {
    configurable: true,
    enumerable: false,
    get: getter,
    set: setter,
  });
}
