import React from 'react';
import { Wrench, Globe, Database, Mail, TerminalSquare } from 'lucide-react';

export default function SkillRegistry() {
  const skills = [
    { id: 'browser_use', name: 'Embodied Browser', icon: <Globe size={16} className="text-blue-400"/>, desc: '控制无头浏览器进行页面导航、点击与信息提取', type: 'Built-in', env: 'Playwright' },
    { id: 'sql_query', name: 'Database Query', icon: <Database size={16} className="text-orange-400"/>, desc: '直连内部 CRM 数据库执行 SQL', type: 'Plugin', env: 'Python/SQLAlchemy' },
    { id: 'send_email', name: 'SMTP Mailer', icon: <Mail size={16} className="text-green-400"/>, desc: '发送带有执行报告的自动化邮件', type: 'Plugin', env: 'SMTP' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="text-orange-500" /> Skill Registry</h1>
          <p className="text-xs text-slate-500 mt-1">管理系统底层的手脚 (原子化工具与执行环境)</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2 px-4 rounded transition-all">
          开发自定义 Skill
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/50 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Skill Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Environment</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {skills.map((skill) => (
              <tr key={skill.id} className="hover:bg-slate-900/30 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3 font-medium">
                  <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center border border-slate-800">{skill.icon}</div>
                  {skill.name}
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{skill.desc}</td>
                <td className="px-6 py-4 text-[10px]"><span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">{skill.type}</span></td>
                <td className="px-6 py-4 text-xs font-mono text-slate-500">{skill.env}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-500 hover:text-blue-400 text-xs font-bold">配置</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}