module.exports = {
  setObjectAttributesToLowerCase(obj) {
    var key,
      keys = Object.keys(obj);
    var n = keys.length;
    var newobj = {};
    while (n--) {
      key = keys[n];
      newobj[key.toLowerCase()] = obj[key];
    }
    return newobj;
  },
  formatEndpointWhitespace(args) {
    return args.map(arg => arg.replace(/\s/g, "+"));
  },
  unflattenObject(data) {
    var result = {};
    for (var i in data) {
      var keys = i.split(".");
      keys.reduce(function(r, e, j) {
        return (
          r[e] ||
          (r[e] = isNaN(Number(keys[j + 1]))
            ? keys.length - 1 == j
              ? data[i]
              : {}
            : [])
        );
      }, result);
    }
    return result;
  },
  flattenObject(ob) {
    var toReturn = {};

    for (var i in ob) {
      if (!ob.hasOwnProperty(i)) continue;

      if (typeof ob[i] == "object" && ob[i] !== null) {
        var flatObject = this.flattenObject(ob[i]);
        for (var x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;

          toReturn[i + "." + x] = flatObject[x];
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
    return toReturn;
  },
  isNumeric(str) {
    if (typeof str != "string") return false; // we only process strings!
    return (
      !isNaN(str) && !isNaN(parseFloat(str)) // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    ); // ...and ensure strings of whitespace fail
  },
  transformObjectStringPropertyToNumber(object) {
    return Object.entries(object).reduce((r, [k, o]) => {
      if (typeof o === "object") {
        r[k] = Object.entries(o).reduce((r, [k, v]) => {
          let _v = Number(v);
          if (!Number.isNaN(_v)) {
            v = _v;
          }
          return (r[k] = v), r;
        }, {});
      }
      return r;
    }, {});
  }
};
