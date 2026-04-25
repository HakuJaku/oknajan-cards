export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("gte", (a, b) => Number(a) >= Number(b));
  Handlebars.registerHelper("lte", (a, b) => Number(a) <= Number(b));

  // Repeat inner block `n` times
  Handlebars.registerHelper("times", function(n, block) {
    let out = "";
    for (let i = 0; i < Number(n); i++) {
      out += block.fn({ index: i });
    }
    return out;
  });
}
