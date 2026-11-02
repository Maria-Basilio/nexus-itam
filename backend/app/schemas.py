from pydantic import BaseModel, Field
from typing import Optional


class FornecedorIn(BaseModel):
    nome: str = Field(min_length=2)
    site: Optional[str] = None
    email_contato: Optional[str] = None


class SoftwareIn(BaseModel):
    nome: str = Field(min_length=2)
    fornecedor_id: int
    categoria: Optional[str] = None
    versao_instalada: str
    versao_recomendada: str


class LicencaIn(BaseModel):
    software_id: int
    tipo: str
    quantidade: int = Field(ge=1)
    custo_anual: float = Field(ge=0)
    data_inicio: str        # YYYY-MM-DD
    data_vencimento: str    # YYYY-MM-DD