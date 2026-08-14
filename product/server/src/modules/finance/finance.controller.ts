import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { FinanceService } from './finance.service';
import { PdfWatermarkService } from '../../services/pdf-watermark.service';

const actor=(req:Request)=>(req as any).user;
const send=(work:(req:Request)=>Promise<any>,status=200)=>async(req:Request,res:Response,next:NextFunction)=>{try{res.status(status).json({status:'success',data:await work(req)});}catch(error){next(error);}};
const currency=(n:any)=>`INR ${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`;

export class FinanceController {
  static dashboard=send(req=>FinanceService.dashboard(Number(req.query.days||30)));
  static students=send(req=>FinanceService.searchStudents(req.query));
  static student=send(req=>FinanceService.studentAccount(req.params.id));
  static collect=send(req=>FinanceService.collectOffline(actor(req),req.body,req),201);
  static transactions=send(req=>FinanceService.transactions(req.query));
  static closingPreview=send(req=>FinanceService.closingPreview(actor(req),req.query.date as string));
  static closings=send(req=>FinanceService.listClosings(actor(req),req.query.status as string));
  static saveClosing=send(req=>FinanceService.saveClosing(actor(req),req.body,false,req),201);
  static submitClosing=send(req=>FinanceService.saveClosing(actor(req),req.body,true,req),201);
  static reviewClosing=send(req=>FinanceService.reviewClosing(actor(req),req.params.id,String(req.body.action).toUpperCase() as any,String(req.body.reason||''),req));
  static requests=send(req=>FinanceService.listRequests(req.query));
  static createRequest=send(req=>FinanceService.createRequest(actor(req),req.body,req),201);
  static reviewRequest=send(req=>FinanceService.reviewRequest(actor(req),req.params.id,String(req.body.decision).toUpperCase() as any,String(req.body.reason||''),req));
  static reconciliation=send(req=>FinanceService.reconciliation(req.query));
  static updateReconciliation=send(req=>FinanceService.updateReconciliation(actor(req),req.params.id,req.body,req));
  static auditLogs=send(()=>FinanceService.auditLogs());
  static createVoucher=send(req=>FinanceService.createExpenseVoucher(actor(req),req.body,req),201);
  static reviewVoucher=send(req=>FinanceService.reviewVoucher(actor(req),req.params.id,String(req.body.decision).toUpperCase() as any,String(req.body.reason||''),req));
  static createReversal=send(req=>FinanceService.createReversalEntry(actor(req),req.body,req),201);
  static budgets=send(()=>FinanceService.getDepartmentBudgets());

      static exportExcel=async(req:Request,res:Response,next:NextFunction)=>{try{const rows:any[]=await FinanceService.transactions(req.query);const workbook=new ExcelJS.Workbook();workbook.creator='CampusOS';const sheet=workbook.addWorksheet('Finance Report',{views:[{state:'frozen',ySplit:5}]});sheet.mergeCells('A1:X1');sheet.getCell('A1').value='CampusOS Finance Transaction Report';sheet.getCell('A1').font={bold:true,size:18,color:{argb:'FFFFFFFF'}};sheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF172033'}};sheet.getCell('A2').value='Generated';sheet.getCell('B2').value=new Date();sheet.getCell('B2').numFmt='dd-mmm-yyyy hh:mm';sheet.getCell('A3').value='Transactions';sheet.getCell('B3').value=rows.length;sheet.getCell('D3').value='Total collected';sheet.getCell('E3').value=rows.filter(r=>r.status==='SUCCEEDED').reduce((a,r)=>a+r.amount,0);sheet.getCell('E3').numFmt='₹#,##0.00';const headers=['S.No','Date','Time','Receipt Number','Student Name','Register Number','Admission Number','Department','Program','Year','Semester','Fee Type','Installment','Original Amount','Scholarship','Concession','Fine','Amount Paid','Remaining Balance','Payment Mode','Gateway','Transaction ID','Status','Collected By','Approved By','Remarks'];sheet.addRow([]);sheet.addRow(headers);rows.forEach((p,i)=>{const total=Number(p.bill.amount)+Number(p.bill.fine)-Number(p.bill.scholarshipDiscount);sheet.addRow([i+1,p.paymentDate||p.verifiedAt||p.createdAt,p.paymentDate||p.verifiedAt||p.createdAt,p.receiptNumber||null,`${p.student.firstName} ${p.student.lastName}`,p.student.admissionNo,p.student.admissionNo,p.student.department?.name||null,p.student.program?.name||null,null,p.student.semester?.name||null,p.bill.category.name,null,p.bill.amount,p.bill.scholarshipDiscount,0,p.bill.fine,p.amount,Math.max(0,total-p.bill.paidAmount),p.method,p.provider||null,p.providerPaymentId||p.externalReference||p.transactionId,p.status,p.verifiedByUserId||null,p.verifiedByUserId||null,p.remarks||null]);});const header=sheet.getRow(5);header.font={bold:true,color:{argb:'FFFFFFFF'}};header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF52627A'}};header.alignment={vertical:'middle',horizontal:'center'};sheet.autoFilter={from:'A5',to:'Z5'};sheet.columns.forEach((c,i)=>{c.width=[7,13,12,21,24,18,18,22,20,10,16,22,14,17,15,15,12,17,18,18,16,23,15,20,20,28][i]||15;});['N','O','P','Q','R','S'].forEach(c=>sheet.getColumn(c).numFmt='₹#,##0.00');sheet.eachRow((row,n)=>{if(n>5&&n%2===0)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF4F7FA'}};});res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition','attachment; filename="campusos-finance-report.xlsx"');await workbook.xlsx.write(res);res.end();}catch(error){next(error);}};

  static exportPdf=async(req:Request,res:Response,next:NextFunction)=>{try{const rows:any[]=await FinanceService.transactions(req.query);res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','inline; filename="campusos-finance-report.pdf"');const doc=new PDFDocument({size:'A4',layout:'landscape',margin:34});PdfWatermarkService.applyWatermark(doc);doc.pipe(res);doc.rect(0,0,841.89,82).fill('#172033');doc.fillColor('#8b7cf6').font('Helvetica-Bold').fontSize(12).text('CAMPUSOS',34,25);doc.fillColor('#fff').fontSize(20).text('Finance transaction report',34,42);doc.fillColor('#111827').fontSize(9).font('Helvetica');let y=105;const cols=[34,105,190,310,405,505,590,680,760];const labels=['Date','Receipt','Student','Register no.','Fee type','Method','Amount','Status'];labels.forEach((v,i)=>doc.font('Helvetica-Bold').text(v,cols[i],y,{width:cols[i+1]-cols[i]-6}));y+=20;for(const p of rows.slice(0,220)){if(y>545){doc.addPage();y=42;}const values=[new Date(p.paymentDate||p.createdAt).toLocaleDateString('en-IN'),p.receiptNumber||'—',`${p.student.firstName} ${p.student.lastName}`,p.student.admissionNo,p.bill.category.name,String(p.method).replaceAll('_',' '),currency(p.amount),p.status];values.forEach((v,i)=>doc.font('Helvetica').fontSize(8).fillColor('#334155').text(String(v),cols[i],y,{width:cols[i+1]-cols[i]-6,ellipsis:true}));doc.moveTo(34,y+15).lineTo(807,y+15).strokeColor('#e2e8f0').stroke();y+=22;}doc.end();}catch(error){next(error);}};
}
