// Al activar las reservas, pegar aquí la URL de inserción de la agenda de diagnósticos.
const agendaDiagnostico = "";
const panels = [...document.querySelectorAll(".panel")];
function navigate(scroll, animate = false) {
  const target = location.hash.slice(1);
  const section = panels.find(panel => panel.id === target) || panels[0];
  const entering = section.hidden;
  panels.forEach(panel => { panel.hidden = panel !== section; });
  document.querySelectorAll("nav a").forEach(link => {
    if (link.hash === "#" + section.id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  if (scroll && target) document.getElementById(target)?.scrollIntoView();
  if (animate && entering && target === section.id && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    section.getAnimations().forEach(animation => animation.cancel());
    section.animate([
      { opacity: 0, transform: "translateY(5px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 220, easing: "ease-out" });
  }
}
navigate(Boolean(location.hash));
window.addEventListener("hashchange", () => navigate(true, true));
const dialog = document.querySelector("dialog");
const form = document.querySelector("form");
const fields = form.elements;
const districts = ["Pueblo Libre", "San Miguel", "Magdalena del Mar", "Jesús María", "San Isidro", "Miraflores", "Surquillo", "Barranco", "Santiago de Surco", "Chorrillos"];
districts.forEach(name => fields.distrito.add(new Option(name, name)));
let subject = "";
function syncDistrict() {
  document.querySelector("#zona").hidden = !subject || fields.modo.value !== "A domicilio";
}
fields.modo.addEventListener("change", syncDistrict);
function limaNow() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone:"America/Lima", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(new Date());
}
function openBooking(topic) {
  subject = topic;
  form.reset();
  fields.hora.setCustomValidity("");
  document.querySelector("output").textContent = "";
  document.querySelector("#titulo").textContent = topic ? (topic === "Otra materia" ? "Pedir otra materia" : "Solicitar clase de " + topic.toLowerCase()) : "Diagnóstico académico";
  document.querySelector("#info").textContent = topic ? "Elige tu horario preferido. Fluent revisará la disponibilidad del docente y coordinará contigo la clase." : "S/ 10 · 1 hora · Por videollamada. Conversaremos sobre tus metas y veremos qué necesitas reforzar.";
  document.querySelector("#otra").hidden = topic !== "Otra materia";
  fields.materia.required = topic === "Otra materia";
  document.querySelector("#modalidad").hidden = !topic;
  syncDistrict();
  fields.fecha.min = limaNow().slice(0,10);
  const agenda = document.querySelector("#agenda");
  agenda.replaceChildren();
  form.hidden = !topic && Boolean(agendaDiagnostico);
  if (form.hidden) {
    const iframe = document.createElement("iframe");
    iframe.title = "Calendario de diagnósticos Fluent";
    iframe.src = agendaDiagnostico;
    agenda.append(iframe);
  }
  dialog.showModal();
}
document.querySelectorAll("[data-diag]").forEach(button => button.onclick = () => openBooking(""));
document.querySelectorAll("[data-class]").forEach(button => button.onclick = () => openBooking(button.dataset.class));
document.querySelector(".close").onclick = () => dialog.close();
form.addEventListener("input", () => { fields.hora.setCustomValidity(""); document.querySelector("output").textContent = ""; });
form.onsubmit = event => {
  event.preventDefault();
  if (fields.fecha.value + " " + fields.hora.value <= limaNow()) {
    fields.hora.setCustomValidity("Elige una fecha y hora futuras en Lima.");
    fields.hora.reportValidity();
    return;
  }
  const topic = subject === "Otra materia" ? fields.materia.value.trim() : subject;
  const lines = ["Fluent · Preferencia de horario", subject ? "Clase de " + topic : "Diagnóstico por videollamada · S/ 10 · 1 hora", fields.fecha.value + " a las " + fields.hora.value + " (Lima)"];
  if (subject) lines.push(fields.modo.value === "Virtual" ? "Virtual" : "A domicilio en " + fields.distrito.value);
  lines.push("Borrador local. Pendiente de envío y confirmación.");
  const url = URL.createObjectURL(new Blob([lines.join("\n")], {type:"text/plain;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Fluent-preferencia-de-horario.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector("output").textContent = "Borrador preparado para descargar.";
};
