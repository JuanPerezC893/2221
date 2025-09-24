export const validarRut = (rut) => {
  rut = rut.replace(/\./g, '');

  if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) {
    return false;
  }
  const [cuerpo, dv] = rut.split('-');
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    if (multiplo < 7) {
      multiplo++;
    } else {
      multiplo = 2;
    }
  }
  const dvEsperado = 11 - (suma % 11);
  const dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  return dvFinal === dv.toUpperCase();
};
