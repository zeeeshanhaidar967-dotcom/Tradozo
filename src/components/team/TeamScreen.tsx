import React, { useState } from 'react';
import { TeamMember, UserRole } from '../../types/shop';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { Shield, UserPlus, Users, Crown, Briefcase, UserCheck, Eye, X } from 'lucide-react';

export const TeamScreen: React.FC = () => {
  const { members, activeShop } = useShop();
  const { t } = useI18n();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const getRoleBadge = (roleStr: UserRole) => {
    switch (roleStr) {
      case 'owner':
        return { label: t('team.roles.owner'), icon: Crown, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40' };
      case 'manager':
        return { label: t('team.roles.manager'), icon: Briefcase, color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40' };
      case 'staff':
        return { label: t('team.roles.staff'), icon: UserCheck, color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/40' };
      case 'viewer':
        return { label: t('team.roles.viewer'), icon: Eye, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;

    // In a real deployed setup, this sends SMS / Email invite
    alert(`Invite sent to ${name} (${contact}) as ${role}!`);
    setName('');
    setContact('');
    setIsInviteOpen(false);
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('team.title')}
            </h2>
            <p className="text-xs text-slate-500">
              Control access for sales staff, billing clerks, and store managers.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="min-h-[44px] px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('team.addMember')}</span>
        </button>
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {members.map(member => {
          const badge = getRoleBadge(member.role);
          const Icon = badge.icon;
          return (
            <div
              key={member.uid}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {member.phoneOrEmail} · Joined {new Date(member.joinedAt).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${badge.color}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('team.addMember')}
              </h2>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Team Member Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number or Email *
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="e.g. 9876543210 or staff@shop.in"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Role & Permissions *
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="manager">{t('team.roles.manager')}</option>
                  <option value="staff">{t('team.roles.staff')}</option>
                  <option value="viewer">{t('team.roles.viewer')}</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow cursor-pointer transition-all"
                >
                  Send Team Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
