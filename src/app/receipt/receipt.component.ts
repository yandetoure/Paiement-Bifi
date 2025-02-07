import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import Tesseract from 'tesseract.js';
import jsPDF from 'jspdf';

interface ReceiptData {
  Agent: string;
  Date: string;
  Code: string;
  Commentaire: string;
  TransactionId: string;
  Montant: string;
  Frais: string;
  Total: string;
  Tel: string;
}

@Component({
  selector: 'app-receipt',
  standalone: true,
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.css'],
  imports: [CommonModule],
})
export class ReceiptComponent {
  file: File | null = null;
  receiptData: ReceiptData | null = null;
  loading: boolean = false;

  onFileChange(event: any) {
    this.file = event.target.files[0];
  }

  async onUpload() {
    if (this.file) {
      this.loading = true;
      const text = await this.recognizeText(this.file);
      this.extractReceiptData(text);
      this.loading = false;
    }
  }

  async recognizeText(file: File): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(
      file,
      'eng',
      {
        logger: (m) => console.log(m),
      }
    );
    return text;
  }

  extractReceiptData(text: string) {
    const lines = text.split('\n');
    const data: Partial<ReceiptData> = {};

    // Regex patterns pour extraire les données
    const patterns: { [key in keyof ReceiptData]?: RegExp } = {
      Agent: /Agent\s*:\s*(.*)/,
      Tel: /(Tel(?:éphone)?(?:\.|:)?\s*:?)(\d[\d\s\-]*)/,
      Date: /Date\s*:\s*(.*)/,
      Code: /Code\s*:\s*(\d+)/,
      Commentaire: /Commentaire\s*:\s*(.*)/,
      TransactionId: /ID Transation\s*:\s*(\d+)/,
      Montant: /Montant\s*:\s*([\d.]+)/,
    };

    lines.forEach(line => {
      for (const key in patterns) {
        const match = line.match(patterns[key as keyof ReceiptData]!);
        if (match) {
          data[key as keyof ReceiptData] = match[1].trim();
        }
      }
    });

    // Calcul des frais et du total
    const montant = Number(data.Montant || 0);
    const frais = montant * 0.01;  // 1% du montant
    const total = montant + frais;

    data.Frais = frais.toFixed(2);
    data.Total = total.toFixed(2);

    this.receiptData = data as ReceiptData;
  }

  generateReceipt() {
    if (!this.receiptData) {
      console.error("Aucune donnée de reçu disponible.");
      return;
    }
   const doc = new jsPDF();

    // Ajouter un logo (optionnel)
    const img = new Image();
    img.src = 'images/logo1.jpeg';
    img.onload = () => {
        doc.addImage(img, 'JPEG', 10, 10, 50, 20);
        
        // Ajout du nom de l'entreprise, email et numéro
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text('BICONSULTING', 140, 15); // Ajustez la position selon besoin
        doc.text('diarrabicons@gmail.com', 140, 20);
        doc.text('Numéro: +221 78 705 67 67', 140, 25);
        
        // Ajouter la signature
        this.addTextToPDF(doc);
    };
}

  private addTextToPDF(doc: jsPDF) {
    if (!this.receiptData) return;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text('Détail de la Facture', 105, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Agent:', 10, 60);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.Agent, 10, 60);

    // doc.setFontSize(12);
    // doc.setFont("helvetica", "bold");
    // doc.text('Tel:', 10, 60);
    // doc.setFont("helvetica", "normal");
    // doc.text(this.receiptData.Tel, 10, 60);

    doc.setFont("helvetica", "bold");
    doc.text('Date:', 10, 70);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.Date, 10, 70);

    doc.setFont("helvetica", "bold");
    doc.text('Bénéficiaire:', 10, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Code: ${this.receiptData.Code}`, 10, 100);
    doc.text(`Commentaire: ${this.receiptData.Commentaire}`, 10, 110);

    doc.setFont("helvetica", "bold");
    doc.text('Transaction:', 10, 130);
    doc.setFont("helvetica", "normal");
    doc.text(`ID Transaction: ${this.receiptData.TransactionId}`, 10, 140);
    doc.text(`Montant: ${this.receiptData.Montant} FCFA`, 10, 150);
    doc.text(`Frais: ${this.receiptData.Frais} FCFA`, 10, 160);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${this.receiptData.Total} FCFA`, 10, 170);


    const today = new Date().toLocaleDateString('fr-FR');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text('Date du reçu:', 10, 180);
    doc.setFont("helvetica", "normal");
    doc.text(today, 35, 180);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('Signature agent:', 80, 180);

    // Ajouter la signature
    const signatureImg = new Image();
    signatureImg.src = 'images/signature.png';
    signatureImg.onload = () => {
        doc.addImage(signatureImg, 'PNG', 75, 180, 50, 20);
        doc.save('reçu.pdf');
    };
    }
}
