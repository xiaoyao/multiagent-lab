package modelproto

import "testing"

func TestNormalizeAnthropicBase(t *testing.T) {
	cases := []struct{ in, want string }{
		{"https://api.anthropic.com", "https://api.anthropic.com"},
		{"https://api.anthropic.com/", "https://api.anthropic.com"},
		{"  https://api.anthropic.com  ", "https://api.anthropic.com"},
		{"https://api.anthropic.com/v1", "https://api.anthropic.com"},        // OpenAI 习惯粘贴 /v1
		{"https://api.deepseek.com/anthropic", "https://api.deepseek.com/anthropic"},
		{"https://open.bigmodel.cn/api/anthropic/", "https://open.bigmodel.cn/api/anthropic"},
	}
	for _, c := range cases {
		if got := NormalizeAnthropicBase(c.in); got != c.want {
			t.Errorf("NormalizeAnthropicBase(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestAnthropicURLs(t *testing.T) {
	if got, want := MessagesURL("https://api.anthropic.com/v1/"), "https://api.anthropic.com/v1/messages"; got != want {
		t.Errorf("MessagesURL = %q, want %q", got, want)
	}
	if got, want := ModelsURL("https://api.anthropic.com"), "https://api.anthropic.com/v1/models?limit=1000"; got != want {
		t.Errorf("ModelsURL = %q, want %q", got, want)
	}
}

func TestKnownAndIsAnthropic(t *testing.T) {
	for _, p := range []string{"", OpenAICompat, Anthropic} {
		if !Known(p) {
			t.Errorf("Known(%q) = false, want true", p)
		}
	}
	if Known("grpc") {
		t.Error(`Known("grpc") = true, want false`)
	}
	if !IsAnthropic(Anthropic) || IsAnthropic(OpenAICompat) || IsAnthropic("") {
		t.Error("IsAnthropic 判定不符")
	}
}
