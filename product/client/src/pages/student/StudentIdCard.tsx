import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Printer } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { saveBlobAndOpen } from '../../platform/download';
import { resolveAssetUrl } from '../../utils/assets';

import { useAuth } from '../../context/AuthContext';

export const StudentIdCard: React.FC = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [cardData, setCardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setIsLoading(true);
        // Canonical user profile fetch
        const res = await api.get('/auth/me');
        const userData = res.data?.data?.user || res.data?.user || user;
        const student = userData?.student || userData;
        
        if (student) {
          setStudentInfo(student);
          if (student.id) {
            const cardRes = await api.get(`/enterprise/id-card/student/${student.id}`).catch(() => null);
            if (cardRes?.data?.status === 'success') {
              setCardData(cardRes.data.data);
            }
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load ID card details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, [user]);

  const handleDownload = async () => {
    const targetId = studentInfo?.id || 'me';
    let blob: Blob;
    try {
      const res = await api.get(`/enterprise/students/${targetId}/id-card/pdf`, { responseType: 'blob' });
      blob = res.data;
    } catch (_) {
      try {
        const res = await api.get(`/enterprise/id-cards/student/${targetId}`, { responseType: 'blob' });
        blob = res.data;
      } catch {
        toast.error('Unable to download file.');
        return;
      }
    }
    const result = await saveBlobAndOpen(blob, `${studentInfo?.firstName || 'Student'}_IDCard.pdf`);
    if (result.success) {
      toast.success('ID Card PDF downloaded successfully.');
    } else {
      toast.error(result.error || 'Unable to download file.');
    }
  };

  if (isLoading) return <Loading text="Loading ID Card..." />;

  const fullName = cardData?.name || `${studentInfo?.firstName} ${studentInfo?.lastName}`;
  const regNo = cardData?.registerNo || studentInfo?.admissionNo || '';
  const deptName = cardData?.department || studentInfo?.department?.name || '';
  const bloodGroup = cardData?.bloodGroup || studentInfo?.bloodGroup || 'O+';
  const validity = cardData?.year ? `Validity: ${cardData.year}` : `Validity: 2026 - 2030`;
  
  const rawPhoto = cardData?.photo || studentInfo?.user?.profilePhoto || user?.profilePhoto;
  const studentPhoto = rawPhoto ? resolveAssetUrl(rawPhoto) : '';
  const verificationUrl = `${window.location.origin}/verify/${cardData?.qrCodeToken || ''}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(regNo)}&scale=2&rotate=N&includetext=false`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" /> Digital Student ID Card
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">High-quality, printable identity verification card</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="px-4 py-2 bg-indigo-600 text-white text-xs font-extrabold rounded-lg shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Side-by-side Card Layout */}
      <div className="flex flex-col lg:flex-row gap-10 justify-center items-center py-6">
        
        {/* FRONT SIDE */}
        <div className="flex flex-col items-center">
          <div className="w-[330px] h-[520px] bg-white border rounded-[20px] shadow-xl relative overflow-hidden flex flex-col justify-between text-center select-none">
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-indigo-50/70 to-transparent pointer-events-none" />
            <div className="absolute top-[-50px] right-[-50px] w-36 h-36 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute top-[-20px] left-[-20px] w-28 h-28 bg-violet-600/5 rounded-full blur-lg pointer-events-none" />
            
            <div className="pt-6 px-4 z-10">
              <div className="flex justify-center mb-1">
                <div className="h-10 w-10 bg-indigo-600/10 border border-indigo-600/20 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">GEETORUS CAMPUSOS</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">College Management System</p>
              <p className="text-[8px] text-indigo-600 font-extrabold tracking-widest uppercase mt-0.5">Digital Student ID Card</p>
            </div>

            <div className="flex justify-center z-10">
              <div className="h-28 w-24 rounded-lg overflow-hidden border-2 border-indigo-100 shadow-md bg-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                {studentPhoto ? (
                  <img
                    src={studentPhoto}
                    className="h-full w-full object-cover"
                    alt="Student Front"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span>{fullName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="mx-6 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white py-1.5 px-4 rounded-full relative shadow-sm z-10">
              <p className="text-[8px] uppercase tracking-widest opacity-85">Full Name:</p>
              <h3 className="text-xs font-black tracking-wide truncate">{fullName.toUpperCase()}</h3>
            </div>

            <div className="px-6 space-y-1 z-10 text-left">
              <div className="flex justify-between items-center text-[10px] text-slate-700">
                <span className="font-extrabold text-slate-400">Register Number:</span>
                <span className="font-bold text-slate-900">{regNo}</span>
              </div>
              <div className="flex justify-between items-start text-[10px] text-slate-700">
                <span className="font-extrabold text-slate-400">Department:</span>
                <span className="font-bold text-slate-900 text-right max-w-[160px] truncate">{deptName}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-700">
                <span className="font-extrabold text-slate-400">Blood Group:</span>
                <span className="font-bold text-slate-900">{bloodGroup}</span>
              </div>
            </div>

            <div className="px-6 z-10 flex flex-col items-center">
              <p className="text-[8px] font-bold text-slate-400 mb-1">Barcode (Code 128)</p>
              <img src={barcodeUrl} className="h-7 w-48 object-contain animate-pulse" alt="Barcode" />
              <p className="text-[8px] font-black text-slate-600 mt-0.5 tracking-widest">{regNo}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 pb-4 px-6 z-10 flex justify-between items-end text-left">
              <div>
                <p className="text-[8px] text-slate-400 font-bold">{validity}</p>
                <p className="text-[8px] text-slate-400 font-bold mt-0.5">Issued: <span className="text-slate-800 font-black">June 2026</span></p>
                <div className="mt-2 text-center">
                  <span className="font-serif italic text-xs text-indigo-700 block max-w-[80px] truncate">{fullName.split(' ')[0]}</span>
                  <div className="border-t border-slate-300 w-16 mx-auto mt-0.5" />
                  <span className="text-[7px] text-slate-400 font-bold block mt-0.5">Student's Signature</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="font-serif italic text-[11px] text-slate-700 block">Dr. Charles Xavier</span>
                <div className="border-t border-slate-300 w-20 mt-0.5" />
                <span className="text-[6px] text-slate-400 font-bold block mt-0.5 leading-tight">Principal's Signature<br/>Principal<br/>GEETORUS Campusos</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600" />
          </div>
          <span className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Front Side</span>
        </div>

        {/* BACK SIDE */}
        <div className="flex flex-col items-center">
          <div className="w-[330px] h-[520px] bg-white border rounded-[20px] shadow-xl relative overflow-hidden flex flex-col justify-between select-none text-left p-5">
            <div className="absolute top-0 right-0 left-0 h-28 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-indigo-600/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-2 border-b pb-2">
              <div className="h-7 w-7 bg-indigo-600/10 border border-indigo-600/20 rounded-full flex items-center justify-center">
                <svg className="h-4.5 w-4.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[10px] font-black text-slate-800 leading-none">GEETORUS CAMPUSOS</h2>
                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">College Management System</p>
              </div>
            </div>

            <h3 className="text-[10px] font-black text-indigo-700 tracking-wider uppercase mt-1">IMPORTANT INFORMATION</h3>

            <div className="space-y-1">
              <h4 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                📞 Emergency Contacts
              </h4>
              <ul className="text-[8.5px] font-bold text-slate-700 space-y-0.5 pl-1">
                <li>• College Office: +91 98765 43210</li>
                <li>• Parent Phone: {studentInfo?.parentPhone}</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                🏠 Student Address
              </h4>
              <p className="text-[8.5px] font-bold text-slate-700 pl-1 leading-normal">
                {studentInfo?.currentAddress || studentInfo?.permanentAddress}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                📝 Student Rules & Regulations
              </h4>
              <ul className="text-[8px] text-slate-600 space-y-0.5 pl-1 leading-tight font-medium">
                <li>• Valid photo ID must be worn at all times.</li>
                <li>• Must carry card to enter library, labs & exams.</li>
                <li>• Card is non-transferable.</li>
                <li>• Lost/Damaged cards must be reported immediately.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                🏛️ Registered Facilities
              </h4>
              <div className="flex gap-2 pl-1">
                {studentInfo?.hostelId && (
                  <span className="flex items-center gap-1 text-[8px] font-bold bg-rose-50 text-rose-700 border border-rose-100 rounded-full px-2 py-0.5 shadow-sm">
                    🏢 Hostel
                  </span>
                )}
                {studentInfo?.transportRouteId && (
                  <span className="flex items-center gap-1 text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 shadow-sm">
                    🚌 Transport
                  </span>
                )}
                <span className="flex items-center gap-1 text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 shadow-sm">
                  📚 Library
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center border-t border-slate-100 pt-2 pb-1">
              <div className="h-16 w-16 border-2 border-indigo-100 p-0.5 rounded bg-white shadow-sm">
                <img src={qrUrl} className="h-full w-full" alt="Back QR" />
              </div>
              <p className="text-[7.5px] text-slate-400 font-bold text-center mt-1 leading-tight">
                Scan to Verify Identity<br/>
                <span className="text-indigo-600 font-black">campusos.geetorus.com</span>
              </p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600" />
          </div>
          <span className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Back Side</span>
        </div>

      </div>
    </div>
  );
};

export default StudentIdCard;
