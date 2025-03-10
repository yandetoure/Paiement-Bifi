import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { createWorker } from 'tesseract.js';

@Component({
  selector: 'app-wizall-recu',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './wizall-recu.component.html',
  styleUrl: './wizall-recu.component.css'
})

export class ReceiptComponent {
  file: File | null = null;
  loading = false;
  receiptData: any = null;

  async onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
    }
  }

  async onUpload() {
    if (!this.file) return;
    
    this.loading = true;
    const worker = await createWorker('fra'); // OCR en français

    const image = URL.createObjectURL(this.file);
    const { data } = await worker.recognize(image);
    await worker.terminate();

    this.receiptData = this.extractData(data.text);
    this.loading = false;
  }

  extractData(text: string) {
    const lines = text.split('\n').map((line) => line.trim());

    const getValueBelow = (label: string) => {
      const index = lines.findIndex((line) => line.includes(label));
      return index !== -1 && index + 1 < lines.length ? lines[index + 1] : 'Non trouvé';
    };

    return {
      ReferenceTransaction: getValueBelow('REFERENCE DE LA TRANSACTION'),
      DateTransaction: getValueBelow('DATE DE LA TRANSACTION'),
      TypeTransaction: getValueBelow('TYPE DE TRANSACTION'),
      ReferenceFacture: getValueBelow('REFERENCE DE LA FACTURE'),
      NumeroClient: getValueBelow('NUMERO CLIENT'),
      Montant: getValueBelow('MONTANT'),
      Frais: getValueBelow('FRAIS'),
      Total: this.calculerTotal(getValueBelow('MONTANT'), getValueBelow('FRAIS')),
    };
  }

  calculerTotal(montant: string, frais: string) {
    const montantNum = parseFloat(montant.replace(/\D/g, '')) || 0;
    const fraisNum = parseFloat(frais.replace(/\D/g, '')) || 0;
    return montantNum + fraisNum;
  }

  generateReceipt() {
    alert('Fonction de génération de PDF à implémenter 🚀');
  }
}
