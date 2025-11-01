import { describe, expect, it } from 'vitest';

import { parseVoiceCommand } from '../voiceCommandParser';

describe('parseVoiceCommand', () => {
  it('parses control commands', () => {
    expect(parseVoiceCommand('next')).toEqual({ type: 'control', action: 'next' });
    expect(parseVoiceCommand('please replay')).toEqual({
      type: 'control',
      action: 'replay',
    });
    expect(parseVoiceCommand('slow motion')).toEqual({ type: 'control', action: 'slow' });
    expect(parseVoiceCommand('pause now')).toEqual({ type: 'control', action: 'pause' });
    expect(parseVoiceCommand('continue lesson')).toEqual({
      type: 'control',
      action: 'resume',
    });
  });

  it('parses kid mode toggles', () => {
    expect(parseVoiceCommand('kid mode on')).toEqual({ type: 'kidMode', enabled: true });
    expect(parseVoiceCommand('turn kid mode off')).toEqual({
      type: 'kidMode',
      enabled: false,
    });
  });

  it('parses level commands', () => {
    expect(parseVoiceCommand('open level two')).toEqual({ type: 'level', level: 2 });
    expect(parseVoiceCommand('level three')).toEqual({ type: 'level', level: 3 });
  });

  it('parses navigation commands', () => {
    expect(parseVoiceCommand('go back')).toEqual({
      type: 'navigate',
      destination: 'welcome',
    });
  });

  it('returns uncertain when nothing matches', () => {
    expect(parseVoiceCommand('gibberish words')).toBe('uncertain');
  });
});
