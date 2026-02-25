"use client"
import React, { useState } from 'react';
import { Download, Plus, Trash2, LayoutTemplate, Briefcase, GraduationCap, User, Wrench, Mail, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const ModernTemplate = ({ data }) => (
  <div className="flex flex-row h-full w-full bg-white print:w-[21cm] print:h-[29.7cm] print:shadow-none shadow-lg">
    <div className="w-1/3 bg-slate-800 text-white p-8 flex flex-col gap-6 print:bg-slate-800 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{data.personal.name || 'Your Name'}</h1>
        <h2 className="text-xl text-slate-300 font-medium">{data.personal.title || 'Professional Title'}</h2>
      </div>
      <div className="flex flex-col gap-3 mt-4 text-sm text-slate-300">
        {data.personal.email && (
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>{data.personal.email}</span>
          </div>
        )}
        {data.personal.phone && (
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>{data.personal.phone}</span>
          </div>
        )}
        {data.personal.location && (
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{data.personal.location}</span>
          </div>
        )}
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold uppercase tracking-wider border-b border-slate-600 pb-2 mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill, index) => (
            <span key={index} className="bg-slate-700 px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
    <div className="w-2/3 p-8 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">Profile</h3>
        <p className="text-slate-600 leading-relaxed text-sm">{data.personal.summary || 'Your professional summary goes here.'}</p>
      </div>
      <div>
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">Experience</h3>
        <div className="flex flex-col gap-6">
          {data.experience.map((exp) => (
            <div key={exp.id}>
              <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-semibold text-slate-800">{exp.role}</h4>
                <span className="text-sm font-medium text-slate-500">{exp.date}</span>
              </div>
              <div className="text-sm text-slate-600 font-medium mb-2">{exp.company}</div>
              <p className="text-sm text-slate-600">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">Education</h3>
        <div className="flex flex-col gap-4">
          {data.education.map((edu) => (
            <div key={edu.id}>
              <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-semibold text-slate-800">{edu.degree}</h4>
                <span className="text-sm font-medium text-slate-500">{edu.date}</span>
              </div>
              <div className="text-sm text-slate-600">{edu.school}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ClassicTemplate = ({ data }) => (
  <div className="flex flex-col h-full w-full bg-white p-10 print:w-[21cm] print:h-[29.7cm] print:shadow-none shadow-lg font-serif">
    <div className="text-center mb-8 border-b-2 border-black pb-6">
      <h1 className="text-4xl font-bold uppercase tracking-widest mb-2">{data.personal.name || 'Your Name'}</h1>
      <h2 className="text-xl text-gray-700 mb-4">{data.personal.title || 'Professional Title'}</h2>
      <div className="flex justify-center items-center gap-4 text-sm text-gray-600 flex-wrap">
        {data.personal.email && <span>{data.personal.email}</span>}
        {data.personal.email && data.personal.phone && <span>•</span>}
        {data.personal.phone && <span>{data.personal.phone}</span>}
        {(data.personal.email || data.personal.phone) && data.personal.location && <span>•</span>}
        {data.personal.location && <span>{data.personal.location}</span>}
      </div>
    </div>
    <div className="mb-6">
      <h3 className="text-lg font-bold uppercase tracking-widest text-black border-b border-gray-300 pb-1 mb-3">Professional Summary</h3>
      <p className="text-gray-800 text-sm leading-relaxed">{data.personal.summary || 'Your professional summary goes here.'}</p>
    </div>
    <div className="mb-6">
      <h3 className="text-lg font-bold uppercase tracking-widest text-black border-b border-gray-300 pb-1 mb-4">Experience</h3>
      <div className="flex flex-col gap-5">
        {data.experience.map((exp) => (
          <div key={exp.id}>
            <div className="flex justify-between items-baseline">
              <h4 className="font-bold text-black text-base">{exp.role}</h4>
              <span className="text-sm font-bold text-gray-600">{exp.date}</span>
            </div>
            <div className="text-sm text-gray-800 italic mb-2">{exp.company}</div>
            <p className="text-sm text-gray-700 list-disc list-inside">{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="mb-6">
      <h3 className="text-lg font-bold uppercase tracking-widest text-black border-b border-gray-300 pb-1 mb-4">Education</h3>
      <div className="flex flex-col gap-4">
        {data.education.map((edu) => (
          <div key={edu.id}>
            <div className="flex justify-between items-baseline">
              <h4 className="font-bold text-black text-base">{edu.degree}</h4>
              <span className="text-sm font-bold text-gray-600">{edu.date}</span>
            </div>
            <div className="text-sm text-gray-800">{edu.school}</div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="text-lg font-bold uppercase tracking-widest text-black border-b border-gray-300 pb-1 mb-3">Skills</h3>
      <div className="text-sm text-gray-800 leading-relaxed">
        {data.skills.join(' • ')}
      </div>
    </div>
  </div>
);

const MinimalTemplate = ({ data }) => (
  <div className="flex flex-col h-full w-full bg-white p-12 print:w-[21cm] print:h-[29.7cm] print:shadow-none shadow-lg font-sans text-gray-800">
    <div className="mb-12">
      <h1 className="text-5xl font-light tracking-tight text-gray-900 mb-2">{data.personal.name || 'Your Name'}</h1>
      <h2 className="text-xl text-gray-500 font-light mb-6">{data.personal.title || 'Professional Title'}</h2>
      <div className="flex gap-6 text-sm text-gray-500 font-light">
        {data.personal.email && <span>{data.personal.email}</span>}
        {data.personal.phone && <span>{data.personal.phone}</span>}
        {data.personal.location && <span>{data.personal.location}</span>}
      </div>
    </div>
    <div className="grid grid-cols-12 gap-8 mb-10">
      <div className="col-span-3 text-sm font-medium text-gray-400 uppercase tracking-widest">Profile</div>
      <div className="col-span-9 text-sm leading-relaxed font-light">{data.personal.summary || 'Your professional summary goes here.'}</div>
    </div>
    <div className="grid grid-cols-12 gap-8 mb-10">
      <div className="col-span-3 text-sm font-medium text-gray-400 uppercase tracking-widest">Experience</div>
      <div className="col-span-9 flex flex-col gap-8">
        {data.experience.map((exp) => (
          <div key={exp.id}>
            <h4 className="font-medium text-gray-900 text-base">{exp.role}</h4>
            <div className="text-sm text-gray-500 mb-2">{exp.company} &mdash; {exp.date}</div>
            <p className="text-sm font-light leading-relaxed">{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-12 gap-8 mb-10">
      <div className="col-span-3 text-sm font-medium text-gray-400 uppercase tracking-widest">Education</div>
      <div className="col-span-9 flex flex-col gap-6">
        {data.education.map((edu) => (
          <div key={edu.id}>
            <h4 className="font-medium text-gray-900 text-base">{edu.degree}</h4>
            <div className="text-sm text-gray-500">{edu.school} &mdash; {edu.date}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-3 text-sm font-medium text-gray-400 uppercase tracking-widest">Skills</div>
      <div className="col-span-9 text-sm font-light leading-relaxed">
        {data.skills.join(', ')}
      </div>
    </div>
  </div>
);

export default function App() {
  const [template, setTemplate] = useState('modern');
  const [activeSection, setActiveSection] = useState('personal');
  
  const [data, setData] = useState({
    personal: {
      name: "Alex Carter",
      title: "Senior Full Stack Developer",
      email: "alex.carter@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      summary: "Passionate and results-driven Full Stack Developer with over 6 years of experience building scalable web applications. Proficient in React, Node.js, and cloud architectures. Strong track record of improving application performance and leading cross-functional teams."
    },
    experience: [
      {
        id: "1",
        company: "TechNova Solutions",
        role: "Senior Frontend Engineer",
        date: "Jan 2021 - Present",
        description: "Led a team of 5 developers to rebuild the core SaaS platform using React and Tailwind CSS, improving load times by 40% and increasing user retention by 15%."
      },
      {
        id: "2",
        company: "WebSphere Dynamics",
        role: "Web Developer",
        date: "Jun 2018 - Dec 2020",
        description: "Developed and maintained multiple client websites using JavaScript, Node.js, and PostgreSQL. Implemented responsive designs and improved SEO rankings by 25% across key client portfolios."
      }
    ],
    education: [
      {
        id: "1",
        school: "University of California, Berkeley",
        degree: "B.S. in Computer Science",
        date: "2014 - 2018"
      }
    ],
    skills: ["JavaScript", "React.js", "Node.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "AWS", "Git", "Agile"]
  });

  const handlePersonalChange = (e) => {
    setData({
      ...data,
      personal: { ...data.personal, [e.target.name]: e.target.value }
    });
  };

  const handleArrayChange = (category, id, field, value) => {
    setData({
      ...data,
      [category]: data[category].map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const addItem = (category, newItem) => {
    setData({
      ...data,
      [category]: [...data[category], { id: Date.now().toString(), ...newItem }]
    });
  };

  const removeItem = (category, id) => {
    setData({
      ...data,
      [category]: data[category].filter(item => item.id !== id)
    });
  };

  const handleSkillsChange = (e) => {
    setData({
      ...data,
      skills: e.target.value.split(',').map(s => s.trim())
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const SectionHeader = ({ title, icon: Icon, section }) => (
    <button
      onClick={() => setActiveSection(activeSection === section ? '' : section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-blue-600" />
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
      {activeSection === section ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
    </button>
  );

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          body {
            margin: 0 !important;
            background: #fff !important;
          }

          body > *:not(.resume-print-page) {
            display: none !important;
          }

          .resume-print-page {
            display: block !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }

          .resume-print-canvas {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }

          .resume-print-preview {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

    <div className="resume-print-page flex h-screen w-full bg-slate-100 font-sans print:bg-white print:h-auto overflow-hidden">
      
      <div className="w-full md:w-[450px] bg-white shadow-xl flex flex-col z-10 print:hidden overflow-hidden h-full">
        <div className="p-6 border-b border-gray-200 bg-blue-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutTemplate size={24} />
              Resume Builder
            </h1>
            <p className="text-blue-100 text-sm mt-1">Create your professional resume</p>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
          <div className="grid grid-cols-3 gap-2">
            {['modern', 'classic', 'minimal'].map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`py-2 px-3 text-sm font-medium rounded-md capitalize transition-colors ${
                  template === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          
          <div className="border-b border-gray-200">
            <SectionHeader title="Personal Details" icon={User} section="personal" />
            {activeSection === 'personal' && (
              <div className="p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" name="name" value={data.personal.name} onChange={handlePersonalChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Job Title</label>
                  <input type="text" name="title" value={data.personal.title} onChange={handlePersonalChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="Software Engineer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" name="email" value={data.personal.email} onChange={handlePersonalChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                    <input type="text" name="phone" value={data.personal.phone} onChange={handlePersonalChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="(555) 123-4567" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Location</label>
                  <input type="text" name="location" value={data.personal.location} onChange={handlePersonalChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="New York, NY" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Professional Summary</label>
                  <textarea name="summary" value={data.personal.summary} onChange={handlePersonalChange} rows={4} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none" placeholder="Briefly describe your professional background..." />
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <SectionHeader title="Experience" icon={Briefcase} section="experience" />
            {activeSection === 'experience' && (
              <div className="p-4 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
                {data.experience.map((exp, index) => (
                  <div key={exp.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                    <button onClick={() => removeItem('experience', exp.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <h4 className="text-sm font-semibold mb-3 text-gray-700">Role {index + 1}</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Company</label>
                        <input type="text" value={exp.company} onChange={(e) => handleArrayChange('experience', exp.id, 'company', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Job Title</label>
                        <input type="text" value={exp.role} onChange={(e) => handleArrayChange('experience', exp.id, 'role', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date Range</label>
                        <input type="text" value={exp.date} onChange={(e) => handleArrayChange('experience', exp.id, 'date', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Jan 2020 - Present" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
                        <textarea value={exp.description} onChange={(e) => handleArrayChange('experience', exp.id, 'description', e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addItem('experience', { company: '', role: '', date: '', description: '' })}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  <Plus size={18} /> Add Experience
                </button>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <SectionHeader title="Education" icon={GraduationCap} section="education" />
            {activeSection === 'education' && (
              <div className="p-4 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
                {data.education.map((edu, index) => (
                  <div key={edu.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                    <button onClick={() => removeItem('education', edu.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <h4 className="text-sm font-semibold mb-3 text-gray-700">Institution {index + 1}</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">School / University</label>
                        <input type="text" value={edu.school} onChange={(e) => handleArrayChange('education', edu.id, 'school', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Degree</label>
                        <input type="text" value={edu.degree} onChange={(e) => handleArrayChange('education', edu.id, 'degree', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date</label>
                        <input type="text" value={edu.date} onChange={(e) => handleArrayChange('education', edu.id, 'date', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="2016 - 2020" />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addItem('education', { school: '', degree: '', date: '' })}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  <Plus size={18} /> Add Education
                </button>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <SectionHeader title="Skills" icon={Wrench} section="skills" />
            {activeSection === 'skills' && (
              <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Skills (comma separated)</label>
                <textarea
                  value={data.skills.join(', ')}
                  onChange={handleSkillsChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  placeholder="React, JavaScript, Node.js..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="resume-print-canvas flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center bg-slate-200 print:bg-white print:p-0 print:overflow-visible relative">
        <div className="w-full max-w-[21cm] mb-4 flex justify-between items-center print:hidden">
          <p className="text-slate-500 text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm">
            Live Preview &bull; {template} Template
          </p>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>

        <div className="resume-print-preview w-full max-w-[21cm] bg-white shadow-2xl print:shadow-none print:w-full print:max-w-none origin-top transition-all duration-300" style={{ minHeight: '29.7cm' }}>
          {template === 'modern' && <ModernTemplate data={data} />}
          {template === 'classic' && <ClassicTemplate data={data} />}
          {template === 'minimal' && <MinimalTemplate data={data} />}
        </div>
      </div>
    </div>
    </>
  );
}
