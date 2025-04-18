import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createWorker } from 'tesseract.js';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-recu',
  standalone: true,
  templateUrl: './recu.component.html',
  styleUrls: ['./recu.component.css'],
  imports: [CommonModule, FormsModule]
})
export class RecuComponent {
  file: File | null = null;
  loading = false;
  receiptData: any = null;
  userName: string = '';

  
  async onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
    }
  }

  async onUpload() {
    if (!this.file) return;
    
    this.loading = true;
    const worker = await createWorker('fra');

    const image = URL.createObjectURL(this.file);
    const { data } = await worker.recognize(image);
    await worker.terminate();

    this.receiptData = this.extractData(data.text);
    this.loading = false;
  }
  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); 
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0'); 
    return `NR${year}${month}${day}${hour}${minute}${second}`;
  }

  extractData(text: string) {
    const lines = text.split('\n').map((line) => line.trim());
  
    const getValueBelow = (label: string) => {
      const index = lines.findIndex((line) => line.includes(label));
      return index !== -1 && index + 1 < lines.length ? lines[index + 1] : 'Non trouvé';
    };
  
    const montant = getValueBelow('MONTANT');
  
    return {
      ReferenceTransaction: getValueBelow('REFERENCE DE LA TRANSACTION'),
      DateTransaction: getValueBelow('DATE DE TRANSACTION'),
      TypeTransaction: getValueBelow('TYPE DE TRANSACTION'),
      ReferenceFacture: getValueBelow('REFERENCE DE LE FACTURE'),
      NumeroClient: getValueBelow('NUMERO CLIENT'),
      Montant: montant,
      Frais: this.calculerFrais(montant),
      Total: this.calculerTotal(montant),
    };
  }
  updateCalculations() {
    // Recalculer les frais et le total si les données sont modifiées manuellement
    const montant = parseFloat(this.receiptData.Montant.replace(/\D/g, '')) || 0;
    
    // Assure-toi que le résultat est une chaîne de caractères
    this.receiptData.Frais = this.calculerFrais(montant.toString()); // Passer le montant comme string
    this.receiptData.Total = this.calculerTotal(montant.toString()); // Passer le montant comme string
  }
  
  calculerFrais(montant: string): string {
    const montantNum = parseFloat(montant.replace(/\D/g, '')) || 0;
    const frais = montantNum * 0.01;
    return this.formatMontant(Math.round(frais));  // Formatté avec séparateur
  }
  
  
  calculerTotal(montant: string): string {
    const montantNum = parseFloat(montant.replace(/\D/g, '')) || 0;
    const fraisNum = parseFloat(this.calculerFrais(montant).replace(/\s/g, '').replace(/\D/g, '')) || 0;
    const total = montantNum + fraisNum;
    const totalArrondi = Math.ceil(total);
    return this.formatMontant(totalArrondi);
  }  
  
  
  
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant);  // ex. 1 000 ou 1 000 000
  }
  
  

  generateReceipt() {
    if (!this.receiptData) {
        console.error("Aucune donnée de reçu disponible.");
        return;
    }

    const doc = new jsPDF();

    const img = new Image();
    img.src = 'images/logo1.jpeg';
    img.onload = () => {
        doc.addImage(img, 'JPEG', 10, 10, 50, 20);
        
        // Ajout du nom de l'entreprise, email et numéro
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text('BICONSULTING', 140, 15);
        doc.text('diarrabicons@gmail.com', 140, 20);
        doc.text('Numéro: +221 78 705 67 67', 140, 25);
        
        // Ajouter la signature
        this.addTextToPDF(doc);
    };
}

private addTextToPDF(doc: jsPDF) {
    if (!this.receiptData) return;

    // Titre
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('Détail du Reçu de Paiement', 105, 55, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const invoiceNumber = this.generateInvoiceNumber();
    doc.text('Numéro de facture:' , 10, 70);
    doc.text(`${invoiceNumber}`, 80, 70);
    
    // Nom du client
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Nom:', 10, 80);
    doc.setFont("helvetica", "normal");
    doc.text(this.userName || 'Non renseigné', 80, 80);
    
    // Les autres informations extraites
    doc.setFont("helvetica", "bold");
    doc.text('Référence Transaction:', 10, 90);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.ReferenceTransaction, 80, 90);

    doc.setFont("helvetica", "bold");
    doc.text('Date Transaction:', 10, 100);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.DateTransaction, 80, 100);

    doc.setFont("helvetica", "bold");
    doc.text('Type Transaction:', 10, 110);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.TypeTransaction, 80, 110);

    doc.setFont("helvetica", "bold");
    doc.text('Référence Facture:', 10, 120);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.ReferenceFacture, 80, 120);

    doc.setFont("helvetica", "bold");
    doc.text('Numéro Client:', 10, 130);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.NumeroClient, 80, 130);

    doc.setFont("helvetica", "bold");
    doc.text('Montant:', 10, 140);
    doc.setFont("helvetica", "normal");
    doc.text(this.receiptData.Montant + ' FCFA', 80, 140);

    doc.setFont("helvetica", "bold");
    doc.text('Frais:', 10, 150);
    doc.setFont("helvetica", "normal"); 
    doc.text(this.receiptData.Frais.replace(/\s/g, String.fromCharCode(160))  + ' FCFA', 80, 150);

    doc.setFont("helvetica", "bold");
    doc.text('Total:', 10, 160);
    doc.setFont("helvetica", "normal"); 
    doc.text(this.receiptData.Total.replace(/\s/g, String.fromCharCode(160)) + ' FCFA', 80, 160);


    const today = new Date().toLocaleDateString('fr-FR');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text('Date du reçu:', 10, 178);
    doc.setFont("helvetica", "normal");
    doc.text(today, 35, 178);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('Signature agent:', 80, 178);

    // Ajouter la signature
    const signatureImg = new Image();
    signatureImg.src = 'images/signature.jpeg';
    signatureImg.onload = () => {
        doc.addImage(signatureImg, 'JPEG', 75, 180, 60, 30);
        doc.save('reçu.pdf');
    };
}

}
