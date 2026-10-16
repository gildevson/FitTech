import { Injectable } from '@angular/core';

export interface CepAddress {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
];

@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly citiesCache = new Map<string, string[]>();

  /** Lista de municípios de um estado (API do IBGE), em ordem alfabética. */
  async getCities(uf: string): Promise<string[]> {
    if (!uf) return [];
    const cached = this.citiesCache.get(uf);
    if (cached) return cached;
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      if (!res.ok) return [];
      const data: { nome: string }[] = await res.json();
      const names = data.map(c => c.nome);
      this.citiesCache.set(uf, names);
      return names;
    } catch {
      return [];
    }
  }

  /** Formata enquanto digita: 01001000 -> 01001-000 */
  format(value: string): string {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  /** Consulta o ViaCEP. Usa fetch para não passar pelo interceptor (o token não vai para terceiros). */
  async lookup(cep: string): Promise<CepAddress | null> {
    const digits = (cep ?? '').replace(/\D/g, '');
    if (digits.length !== 8) return null;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.erro) return null;
      return {
        zipCode: this.format(digits),
        street: data.logradouro ?? '',
        neighborhood: data.bairro ?? '',
        city: data.localidade ?? '',
        state: data.uf ?? ''
      };
    } catch {
      return null;
    }
  }
}
