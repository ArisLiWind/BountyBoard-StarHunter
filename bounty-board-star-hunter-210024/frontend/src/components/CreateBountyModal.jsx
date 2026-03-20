import React, { useState } from 'react';
import { getTranslation, formatMessage } from '../utils/language.js';
import bountyStorage, { TOKEN_TYPES } from '../data/mockData.js';

// API 基础路径
const API_BASE_URL = window.location.origin;

// 定义支持的币种列表及对应的合约地址
const SUPPORTED_TOKENS = [
  { value: 'EVE', label: 'EVE', address: '0xaa2b2c89ce420035cb7ec35201826a89881238e4dfd2208fde0c54f11c7a4ea0::EVE::EVE' },
  { value: 'FUEL', label: 'FUEL', address: '0xffeca0a98bd75145a10e597cc5a02614cc651f3c1b8d79134bec40ff1fcefc91::fuel::FUEL' },
  { value: 'SUI', label: 'SUI', address: '0x2::sui::SUI' },
  { value: 'USDT', label: 'USDT', address: '0x700de8dea1aac1de7531e9d20fc2568b12d74369f91b7fad3abc1c4f40396e52::usdt::USDT' },
  { value: 'USDC', label: 'USDC', address: '0xb1b59612aa2ec15501474e40ab176cd298b881bddcf1e7afbb369cefc324614b::usdc::USDC' }
];

const CreateBountyModal = ({ isOpen, onClose, onSuccess, currentLang }) => {
  const t = (key) => getTranslation(currentLang, key);
  const fm = (key, params) => formatMessage(currentLang, key, params);

  const [formData, setFormData] = useState({
    targetUID: '',
    rewardAmount: '',
    tokenType: 'EVE', // 默认 EVE
    killCount: 1,
    timeframeDays: 7,
    isFutureKiller: false,
    remarks: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.isFutureKiller && !formData.targetUID.trim()) {
      newErrors.targetUID = t('validation.targetUIDRequired');
    }

    if (!formData.rewardAmount || parseFloat(formData.rewardAmount) <= 0) {
      newErrors.rewardAmount = t('validation.rewardAmountPositive');
    }

    if (formData.killCount < 1 || formData.killCount > 100) {
      newErrors.killCount = t('validation.killCountRange');
    }

    if (formData.timeframeDays < 7 || formData.timeframeDays > 365) {
      newErrors.timeframe = t('validation.timeframeRange');
    }

    const remarkLength = formData.remarks.length;
    const isEnglish = /^[\x00-\x7F]*$/.test(formData.remarks);
    if ((isEnglish && remarkLength > 64) || (!isEnglish && remarkLength > 20)) {
      newErrors.remarks = t('validation.remarksLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      // 获取当前选中币种的合约地址
      const selectedToken = SUPPORTED_TOKENS.find(t => t.value === formData.tokenType);
      const tokenAddress = selectedToken ? selectedToken.address : '';
      
      // 获取当前玩家 UID
      const currentPlayerUID = bountyStorage.getCurrentPlayerUID();
      
      // 准备后端请求数据
      const bountyData = {
        targetUID: formData.isFutureKiller ? 'FUTURE_KILLER_PLACEHOLDER' : formData.targetUID,
        creatorUID: currentPlayerUID,
        rewardAmount: parseFloat(formData.rewardAmount),
        tokenType: formData.tokenType,
        tokenAddress: tokenAddress,
        killCount: parseInt(formData.killCount),
        timeframeDays: parseInt(formData.timeframeDays),
        isFutureKiller: formData.isFutureKiller,
        remarks: formData.remarks
      };

      // 调用后端 API
      const response = await fetch(`${API_BASE_URL}/api/bounties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bountyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bounty');
      }

      const result = await response.json();
      
      if (result.success) {
        // 同步更新本地 mockData（用于立即显示）
        const localBounty = bountyStorage.createBounty({
          ...formData,
          tokenAddress
        });
        
        // 触发成功回调
        onSuccess && onSuccess(result.bounty || localBounty);
        
        // 关闭模态框
        handleClose();
      } else {
        throw new Error('Bounty creation failed');
      }
    } catch (error) {
      console.error('Error creating bounty:', error);
      
      // 显示错误提示（可以使用更友好的 UI 提示）
      setErrors({
        submit: currentLang === 'zh' 
          ? `创建失败: ${error.message}` 
          : `Failed: ${error.message}`
      });
      
      // 降级处理：仍然创建本地悬赏
      const selectedToken = SUPPORTED_TOKENS.find(t => t.value === formData.tokenType);
      const tokenAddress = selectedToken ? selectedToken.address : '';
      
      const localBounty = bountyStorage.createBounty({
        ...formData,
        tokenAddress
      });
      
      onSuccess && onSuccess(localBounty);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      targetUID: '',
      rewardAmount: '',
      tokenType: 'EVE',
      killCount: 1,
      timeframeDays: 7,
      isFutureKiller: false,
      remarks: ''
    });
    setErrors({});
    onClose();
  };

  const perKillReward = formData.rewardAmount && formData.killCount
    ? (parseFloat(formData.rewardAmount) / parseInt(formData.killCount)).toFixed(2)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-slide-in">
      <div className="relative w-full max-w-2xl bg-[#000000] border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-[#000000] border-b border-white/20 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-mono font-light tracking-wider text-white uppercase">
            {t('createBounty.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-white/50 hover:text-[#FF0000] transition-colors duration-300"
            aria-label={t('common.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#2A2A2A] border border-white/10">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.isFutureKiller}
                    onChange={(e) => handleChange('isFutureKiller', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-mono text-sm font-light tracking-wide">
                    {t('createBounty.futureKillerLabel')}
                  </div>
                  <div className="text-white/50 font-mono text-xs mt-1">
                    {t('createBounty.futureKillerHint')}
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-white/70 font-mono text-sm font-light tracking-wide mb-2">
                {t('createBounty.targetUID')}
              </label>
              {formData.isFutureKiller ? (
                <div className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#FF0000]/50 text-[#FF0000] font-mono text-sm">
                  {t('createBounty.futureKillerAutoGenerate')}
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.targetUID}
                  onChange={(e) => handleChange('targetUID', e.target.value)}
                  placeholder={t('createBounty.targetUIDPlaceholder')}
                  className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide"
                />
              )}
              {errors.targetUID && (
                <p className="text-[#FF0000] text-xs font-mono mt-1">{errors.targetUID}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 font-mono text-sm font-light tracking-wide mb-2">
                  {t('createBounty.rewardAmount')}
                </label>
                <input
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => handleChange('rewardAmount', e.target.value)}
                  placeholder={t('createBounty.rewardAmountPlaceholder')}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide"
                />
                {errors.rewardAmount && (
                  <p className="text-[#FF0000] text-xs font-mono mt-1">{errors.rewardAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-white/70 font-mono text-sm font-light tracking-wide mb-2">
                  {t('createBounty.tokenType')}
                </label>
                <select
                  value={formData.tokenType}
                  onChange={(e) => handleChange('tokenType', e.target.value)}
                  className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide"
                >
                  {SUPPORTED_TOKENS.map(token => (
                    <option key={token.value} value={token.value}>{token.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/70 font-mono text-sm font-light tracking-wide">
                  {t('createBounty.killCountLabel')}: {formData.killCount}
                </label>
                <span className="text-[#FF0000] font-mono text-sm font-light">
                  {t('createBounty.perKillReward')}: {perKillReward} {formData.tokenType}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={formData.killCount}
                onChange={(e) => handleChange('killCount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-white/30 font-mono text-xs mt-1">
                <span>{t('createBounty.minKills')}</span>
                <span>{t('createBounty.maxKills')}</span>
              </div>
              {errors.killCount && (
                <p className="text-[#FF0000] text-xs font-mono mt-1">{errors.killCount}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/70 font-mono text-sm font-light tracking-wide">
                  {t('createBounty.timeframe')}: {formData.timeframeDays} {t('common.days')}
                </label>
              </div>
              <input
                type="range"
                min="7"
                max="365"
                value={formData.timeframeDays}
                onChange={(e) => handleChange('timeframeDays', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-white/30 font-mono text-xs mt-1">
                <span>{t('createBounty.minDays')}</span>
                <span>{t('createBounty.maxDays')}</span>
              </div>
              <div className="text-white/50 font-mono text-xs mt-2">
                {fm('createBounty.timeframeHint', {
                  count: formData.killCount,
                  days: formData.timeframeDays,
                  reward: perKillReward + ' ' + formData.tokenType
                })}
              </div>
              {errors.timeframe && (
                <p className="text-[#FF0000] text-xs font-mono mt-1">{errors.timeframe}</p>
              )}
            </div>

            <div>
              <label className="block text-white/70 font-mono text-sm font-light tracking-wide mb-2">
                {t('createBounty.remarks')}
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder={t('createBounty.remarksPlaceholder')}
                rows="3"
                className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide resize-none"
              />
              <div className="flex justify-between text-white/30 font-mono text-xs mt-1">
                <span>
                  {formData.remarks.length} {/^[\x00-\x7F]*$/.test(formData.remarks) ? '/ 64' : '/ 20'}
                </span>
                <span className="text-right">
                  {t('createBounty.remarksLimitEn')}<br/>
                  {t('createBounty.remarksLimitZh')}
                </span>
              </div>
              {errors.remarks && (
                <p className="text-[#FF0000] text-xs font-mono mt-1">{errors.remarks}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="p-4 bg-[#FF0000]/10 border border-[#FF0000]/50 text-[#FF0000] font-mono text-xs">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 btn-secondary font-mono text-sm font-light tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('createBounty.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 btn-primary font-mono text-sm font-bold tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{isSubmitting ? (currentLang === 'zh' ? '提交中...' : 'Submitting...') : t('createBounty.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBountyModal;