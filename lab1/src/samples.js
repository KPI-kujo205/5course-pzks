export const UNIT = [
  '*a + nb -',
  'a ++ nb /* k -+/ g',
  'a^b$c - d#h + q%t + !b&(z|t)',
  'x + var1 + var_2 + _var_3 + var#4 + var!5 + 6var_ + $7 + ?8',
  '125 + 2nb - 0xAB * 0x0R + 0b010 * 0b20 + ABh * 0Rh + 010b*20b',
  '0.71/0.72.3 + .3 + 127.0.0.1*8. + 6.07ab - 9f.89hgt',
  ')a+b( -(g+h)(g-k))*()) + (-b(t-2*x*(5) + A[7][2-x]',
  '2(t) - f2(t) + g()/h(2, )*func(-t/q, f(4-t), -(x+2)*(y-2))',
];

export const EXAMPLE = '-a ++ b - 2v*func((t+2 -, sin(x/*2.01.2), )/8(-)**';

export const GENERAL = [
  '/a*b**c + m)*a*b + a*c - a*smn(j*k/m + m',
  '-cos(-&t))/(*(*f)(127.0.0.1, "/dev/null", (t==0)?4more_errors:b^2) - .5',
  '//(*0)- an*0p(a+b)-1.000.5//6(*f(-b, 1.8-0*(2-6) %1 + (++a)/(6x^2+4x-1) + d/dt*(smn(at+q)/(4cos(at)-ht^2)',
  '-(-5x((int*)exp())/t - 3.14.15k/(2x^2-5x-1)*y - A[N*(i++)+j]',
  '-(-exp(3et/4.0.2, 2i-1)/L + )((void*)*f()) + ((i++) + (++i/(i--))/k//) + 6.000.500.5',
  '**f(*k, -p+1, ))2.1.1 + 1.8q((-5x ++ i)',
  '/.1(2x^2-5x+7)-(-i)+ (j++)/0 - )(*f)(2, 7-x, )/q + send(-(2x+7)/A[j, i], 127.0.0.1 ) + )/',
  '*101*1#(t-q)(t+q)//dt - (int*)f(8t, -(k/h)A[i+6.]), exp(), ))(t-k*8.00.1/.0',
];

export const SAMPLES = [...UNIT, EXAMPLE, ...GENERAL];
